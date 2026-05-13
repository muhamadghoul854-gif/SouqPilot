import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${process.env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const token = await getAccessToken();
  const res = await fetch(`${process.env.PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      auth_algo: req.headers.get("paypal-auth-algo"),
      cert_url: req.headers.get("paypal-cert-url"),
      client_id: process.env.PAYPAL_CLIENT_ID,
      transmission_id: req.headers.get("paypal-transmission-id"),
      transmission_sig: req.headers.get("paypal-transmission-sig"),
      transmission_time: req.headers.get("paypal-transmission-time"),
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  const { verification_status } = await res.json();
  return verification_status === "SUCCESS";
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const valid = await verifySignature(req, rawBody);
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const event = JSON.parse(rawBody) as Record<string, unknown>;
  const eventId = event.id as string;
  const eventType = event.event_type as string;

  const duplicate = await db.transaction.findUnique({ where: { providerEventId: eventId }, select: { id: true } });
  if (duplicate) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
        await handleCaptureCompleted(event, eventId);
        break;
      case "PAYMENT.CAPTURE.DENIED":
        await handleCaptureDenied(event, eventId);
        break;
      case "PAYMENT.CAPTURE.REFUNDED":
        await handleCaptureRefunded(event, eventId);
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCaptureCompleted(event: Record<string, unknown>, eventId: string) {
  const resource = event.resource as Record<string, unknown>;
  const paypalOrderId = resource.custom_id as string;

  await db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { paypalCaptureId: paypalOrderId },
      include: { product: { select: { downloadLimit: true } } },
    });
    if (!order || order.status === "completed") return;

    const amount = parseFloat(((resource.amount as Record<string, string>)?.value ?? "0"));
    const currency = ((resource.amount as Record<string, string>)?.currency_code ?? "USD");

    await tx.order.update({ where: { id: order.id }, data: { status: "completed", paidAt: new Date(), paypalCaptureId: resource.id as string } });
    await tx.transaction.create({ data: { orderId: order.id, eventType: "PAYMENT.CAPTURE.COMPLETED", provider: "paypal", providerEventId: eventId, amount, currency, status: "succeeded", rawPayload: event as object } });
    await tx.downloadLink.create({ data: { orderId: order.id, token: crypto.randomUUID(), expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), maxClicks: order.product.downloadLimit } });
  });
}

async function handleCaptureDenied(event: Record<string, unknown>, eventId: string) {
  const resource = event.resource as Record<string, unknown>;
  const paypalOrderId = resource.custom_id as string;
  const order = await db.order.findFirst({ where: { paypalCaptureId: paypalOrderId }, select: { id: true, totalAmount: true, currency: true } });
  if (!order) return;
  await db.$transaction([
    db.order.update({ where: { id: order.id }, data: { status: "failed" } }),
    db.transaction.create({ data: { orderId: order.id, eventType: "PAYMENT.CAPTURE.DENIED", provider: "paypal", providerEventId: eventId, amount: Number(order.totalAmount), currency: order.currency, status: "failed", rawPayload: event as object } }),
  ]);
}

async function handleCaptureRefunded(event: Record<string, unknown>, eventId: string) {
  const resource = event.resource as Record<string, unknown>;
  const captureId = ((resource.links as Array<{ rel: string; href: string }>)?.find(l => l.rel === "up")?.href.split("/").pop()) ?? "";

  await db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { paypalCaptureId: captureId } });
    if (!order) return;
    await tx.order.update({ where: { id: order.id }, data: { status: "refunded", refundedAt: new Date() } });
    await tx.downloadLink.updateMany({ where: { orderId: order.id }, data: { revoked: true, expiresAt: new Date() } });
    await tx.transaction.create({ data: { orderId: order.id, eventType: "PAYMENT.CAPTURE.REFUNDED", provider: "paypal", providerEventId: eventId, amount: parseFloat(((resource.amount as Record<string, string>)?.value ?? "0")), currency: ((resource.amount as Record<string, string>)?.currency_code ?? "USD"), status: "refunded", rawPayload: event as object } });
  });
}
