import { NextResponse } from "next/server";

import { handleStripeEvent } from "@/lib/billing/webhook";
import {
  createStripeClient,
  getStripeWebhookSecret,
} from "@/lib/billing/stripe";
import { logServerError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = getStripeWebhookSecret();
  const stripeResult = createStripeClient();

  if (!webhookSecret || !stripeResult.ok) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 500 }
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe webhook signature." },
      { status: 400 }
    );
  }

  const payload = await request.text();
  let event;

  try {
    event = stripeResult.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 400 }
    );
  }

  try {
    await handleStripeEvent(event, stripeResult.stripe);
  } catch (caught) {
    logServerError("stripe-webhook", caught);
    return NextResponse.json(
      { error: "Unable to process Stripe webhook." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
