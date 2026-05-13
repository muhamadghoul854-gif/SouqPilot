import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Idempotency check
  const duplicate = await db.transaction.findUnique({
    where: { providerEventId: event.id }, select: { id: true },
  });
  if (duplicate) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event);
        break;
      case "charge.refunded":
        await handleRefund(event);
        break;
      case "checkout.session.completed":
        await handleSessionCompleted(event);
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    console.error(`[stripe-webhook] ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const pi = event.data.object as Stripe.PaymentIntent;

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { paymentIntentId: pi.id },
      include: { product: { select: { downloadLimit: true } } },
    });
    if (!order) throw new Error(`No order for PI: ${pi.id}`);
    if (order.status === "completed") return;

    await tx.order.update({
      where: { id: order.id },
      data: { status: "completed", paidAt: new Date() },
    });

    await tx.transaction.create({
      data: {
        orderId: order.id, eventType: event.type, provider: "stripe",
        providerEventId: event.id, amount: pi.amount_received / 100,
        currency: pi.currency.toUpperCase(), status: "succeeded",
        rawPayload: event as object,
      },
    });

    await tx.downloadLink.create({
      data: {
        orderId: order.id,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxClicks: order.product.downloadLimit,
      },
    });
  });
}

async function handlePaymentFailed(event: Stripe.Event) {
  const pi = event.data.object as Stripe.PaymentIntent;
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { paymentIntentId: pi.id }, select: { id: true, status: true, totalAmount: true, currency: true } });
    if (!order || order.status === "failed") return;
    await tx.order.update({ where: { id: order.id }, data: { status: "failed" } });
    await tx.transaction.create({
      data: {
        orderId: order.id, eventType: event.type, provider: "stripe",
        providerEventId: event.id, amount: Number(order.totalAmount),
        currency: order.currency, status: "failed", rawPayload: event as object,
      },
    });
  });
}

async function handleRefund(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { paymentIntentId: piId }, select: { id: true, currency: true, totalAmount: true } });
    if (!order) return;
    await tx.order.update({ where: { id: order.id }, data: { status: "refunded", refundedAt: new Date() } });
    await tx.downloadLink.updateMany({ where: { orderId: order.id }, data: { revoked: true, expiresAt: new Date() } });
    await tx.transaction.create({
      data: {
        orderId: order.id, eventType: event.type, provider: "stripe",
        providerEventId: event.id, amount: charge.amount_refunded / 100,
        currency: charge.currency.toUpperCase(), status: "refunded", rawPayload: event as object,
      },
    });
  });
}

async function handleSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") return;
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (piId) {
    await db.order.updateMany({ where: { paymentIntentId: piId }, data: { stripeSessionId: session.id } });
  }
}
