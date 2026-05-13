import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { CheckoutSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId, isPublished: true },
    select: { id: true, title: true, price: true, currency: true, thumbnailUrl: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const order = await db.order.create({
    data: {
      userId, productId: product.id,
      status: "pending",
      totalAmount: product.price,
      currency: product.currency,
      paymentProvider: "stripe",
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: product.currency.toLowerCase(),
        unit_amount: Math.round(Number(product.price) * 100),
        product_data: {
          name: product.title,
          images: product.thumbnailUrl ? [product.thumbnailUrl] : [],
        },
      },
      quantity: 1,
    }],
    metadata: { orderId: order.id, userId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?order=success&id=${order.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.id}?order=cancelled`,
  });

  if (typeof session.payment_intent === "string") {
    await db.order.update({
      where: { id: order.id },
      data: { paymentIntentId: session.payment_intent, stripeSessionId: session.id },
    });
  }

  return NextResponse.json({ checkoutUrl: session.url, orderId: order.id });
}
