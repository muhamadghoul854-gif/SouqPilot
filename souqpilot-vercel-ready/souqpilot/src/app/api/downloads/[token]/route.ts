import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSignedDownloadUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  // 1. Auth
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Token format
  if (!UUID_RE.test(params.token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // 3. Fetch link
  const link = await db.downloadLink.findUnique({
    where: { token: params.token },
    include: {
      order: {
        select: {
          userId: true,
          status: true,
          product: { select: { title: true, s3Key: true } },
        },
      },
    },
  });

  // 4. Existence check
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 5. Authorization — 404 not 403 to prevent token enumeration
  if (link.order.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 6. Order must be completed
  if (link.order.status !== "completed") {
    return NextResponse.json({ error: "Payment not confirmed" }, { status: 402 });
  }

  // 7. Revocation
  if (link.revoked) {
    return NextResponse.json({ error: "Link has been revoked" }, { status: 410 });
  }

  // 8. Row expiry
  if (link.expiresAt < new Date()) {
    return NextResponse.json({ error: "Download access expired" }, { status: 410 });
  }

  // 9. Click limit
  if (link.clickCount >= link.maxClicks) {
    return NextResponse.json({ error: `Download limit reached (${link.maxClicks}/${link.maxClicks})` }, { status: 429 });
  }

  // 10. Generate fresh 1-hour S3 presigned URL
  let signedUrl: string;
  try {
    const result = await generateSignedDownloadUrl(link.order.product.s3Key, link.order.product.title);
    signedUrl = result.url;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "S3 error";
    console.error(`[downloads] ${msg}`);
    return NextResponse.json({ error: "Could not generate link. Try again." }, { status: 502 });
  }

  // 11. Atomic counter increment with optimistic lock
  try {
    await db.downloadLink.update({
      where: { id: link.id, clickCount: link.clickCount },
      data: {
        clickCount: { increment: 1 },
        lastUsedAt: new Date(),
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
      },
    });
  } catch {
    // Race condition — re-check
    const fresh = await db.downloadLink.findUnique({ where: { id: link.id }, select: { clickCount: true, maxClicks: true } });
    if (fresh && fresh.clickCount >= fresh.maxClicks) {
      return NextResponse.json({ error: "Download limit reached" }, { status: 429 });
    }
  }

  // 12. Redirect — browser never sees the S3 key
  return NextResponse.redirect(signedUrl, {
    status: 302,
    headers: { "Cache-Control": "no-store, no-cache" },
  });
}
