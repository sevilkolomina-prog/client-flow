"use server";

import { redirect } from "next/navigation";

import { isPaidPlan, parsePlan } from "@/lib/billing/plans";
import { assertCheckoutPrice, createStripeClient } from "@/lib/billing/stripe";
import { getAuthOrigin } from "@/lib/auth/origin";
import {
  APP_CONFIG_ERROR,
  BILLING_UNAVAILABLE_ERROR,
  logServerError,
  toUserFacingError,
} from "@/lib/errors";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type CheckoutActionState = {
  error?: string;
};

const PAID_CHECKOUT_STATUSES = new Set(["active", "trialing", "past_due"]);

export async function createCheckoutSession(
  plan: string
): Promise<CheckoutActionState> {
  if (!isPaidPlan(plan)) {
    return { error: "Choose Pro or Business to start checkout." };
  }

  if (!getSupabaseEnv()) {
    return { error: APP_CONFIG_ERROR };
  }

  const stripeResult = createStripeClient();

  if (!stripeResult.ok) {
    logServerError("billing-checkout", stripeResult.error);
    return { error: BILLING_UNAVAILABLE_ERROR };
  }

  const stripe = stripeResult.stripe;
  const priceId = stripeResult.priceIds[plan];
  const priceCheck = await assertCheckoutPrice(stripe, plan, priceId);

  if (priceCheck.error) {
    logServerError("billing-checkout-price", priceCheck.error);
    return { error: BILLING_UNAVAILABLE_ERROR };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { error: toUserFacingError(error, "You must be logged in.") };
  }

  if (!data.user) {
    redirect("/login");
  }

  const email = data.user.email?.trim() ?? "";
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, stripe_customer_id, subscription_status")
    .eq("id", data.user.id)
    .maybeSingle();

  const currentPlan = parsePlan(profile?.plan);
  const subscriptionStatus =
    typeof profile?.subscription_status === "string"
      ? profile.subscription_status.toLowerCase()
      : "";

  if (
    isPaidPlan(currentPlan) ||
    PAID_CHECKOUT_STATUSES.has(subscriptionStatus)
  ) {
    return {
      error:
        "You already have a subscription. Use Manage billing in Settings to change plans.",
    };
  }

  const stripeCustomerId =
    typeof profile?.stripe_customer_id === "string" &&
    profile.stripe_customer_id.startsWith("cus_")
      ? profile.stripe_customer_id
      : null;

  const origin = await getAuthOrigin();
  const metadata = {
    supabase_user_id: data.user.id,
    plan,
  };

  let checkoutUrl: string;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      client_reference_id: data.user.id,
      metadata,
      subscription_data: {
        metadata,
      },
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : email
          ? { customer_email: email }
          : {}),
    });

    if (!session.url) {
      return { error: "Unable to start checkout. Please try again." };
    }

    checkoutUrl = session.url;
  } catch (caught) {
    logServerError("billing-checkout", caught);
    return {
      error: toUserFacingError(caught, "Unable to start checkout. Please try again."),
    };
  }

  redirect(checkoutUrl);
}

export type PortalActionState = {
  error?: string;
};

export async function createBillingPortalSession(): Promise<PortalActionState> {
  if (!getSupabaseEnv()) {
    return { error: APP_CONFIG_ERROR };
  }

  const stripeResult = createStripeClient();

  if (!stripeResult.ok) {
    logServerError("billing-portal", stripeResult.error);
    return { error: BILLING_UNAVAILABLE_ERROR };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { error: toUserFacingError(error, "You must be logged in.") };
  }

  if (!data.user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, stripe_customer_id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: toUserFacingError(profileError, "Unable to load billing details."),
    };
  }

  if (!isPaidPlan(profile?.plan)) {
    return {
      error: "Upgrade to Pro or Business to manage a subscription.",
    };
  }

  const stripeCustomerId =
    typeof profile?.stripe_customer_id === "string" &&
    profile.stripe_customer_id.startsWith("cus_")
      ? profile.stripe_customer_id
      : null;

  if (!stripeCustomerId) {
    return { error: "No billing customer is linked to this account yet." };
  }

  const origin = await getAuthOrigin();
  let portalUrl: string;

  try {
    const session = await stripeResult.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    if (!session.url) {
      return { error: "Unable to open billing management. Please try again." };
    }

    portalUrl = session.url;
  } catch (caught) {
    logServerError("billing-portal", caught);
    return {
      error: toUserFacingError(
        caught,
        "Unable to open billing management. Please try again."
      ),
    };
  }

  redirect(portalUrl);
}
