import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateUploadPresignedUrl } from "@/lib/s3";
import { ProductSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "12"));

  const where = { isPublished: true, ...(category ? { category } : {}) };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      select: {
        id: true, title: true, slug: true, description: true,
        category: true, price: true, currency: true,
        previewUrl: true, thumbnailUrl: true, version: true,
        fileSizeBytes: true,
        seller: { select: { fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (!userId || !["seller", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  const { title, description, category, price, currency, contentType, downloadLimit } = parsed.data;
  const { uploadUrl, fields, s3Key } = await generateUploadPresignedUrl(userId, contentType);

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36);

  const product = await db.product.create({
    data: {
      sellerId: userId, title, slug, description, category,
      price, currency, s3Key,
      s3Bucket: process.env.S3_BUCKET_NAME!,
      downloadLimit, isPublished: false,
    },
    select: { id: true, slug: true, title: true },
  });

  return NextResponse.json({ product, upload: { url: uploadUrl, fields, s3Key } }, { status: 201 });
}
