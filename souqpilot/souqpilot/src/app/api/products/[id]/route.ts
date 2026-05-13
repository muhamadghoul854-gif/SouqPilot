import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const product = await db.product.findUnique({
    where: { id: params.id, isPublished: true },
    include: { seller: { select: { fullName: true, avatarUrl: true } } },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await db.product.findUnique({ where: { id: params.id }, select: { sellerId: true } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (product.sellerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const updated = await db.product.update({
    where: { id: params.id },
    data: { isPublished: body.isPublished, fileSizeBytes: body.fileSizeBytes },
  });
  return NextResponse.json({ product: updated });
}
