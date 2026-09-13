"use server";

import { redirect } from "next/navigation";

import { isPaidPlan } from "@/lib/billing/plans";
import { assertCheckoutPrice, createStripeClient } from "@/lib/billing/stripe";
import { getAuthOrigin } from "@/lib/auth/origin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type CheckoutActionState = {
  error?: string;
};

export async function createCheckoutSession(
  plan: string
): Promise<CheckoutActionState> {
  if (!isPaidPlan(plan)) {
    return { error: "Choose Pro or Business to start checkout." };
  }

  if (!getSupabaseEnv()) {
    return {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const stripeResult = createStripeClient();

  if (!stripeResult.ok) {
    return { error: stripeResult.error };
  }

  const stripe = stripeResult.stripe;
  const priceId = stripeResult.priceIds[plan];
  const priceCheck = await assertCheckoutPrice(stripe, plan, priceId);

  if (priceCheck.error) {
    return { error: priceCheck.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    redirect("/login");
  }

  const email = data.user.email?.trim() ?? "";
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", data.user.id)
    .maybeSingle();

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
      return { error: "Stripe did not return a checkout URL." };
    }

    checkoutUrl = session.url;
  } catch (caught) {
    const message =
      caught instanceof Error && caught.message
        ? caught.message
        : "Unable to start Stripe checkout.";

    return { error: message };
  }

  redirect(checkoutUrl);
}

export type PortalActionState = {
  error?: string;
};

export async function createBillingPortalSession(): Promise<PortalActionState> {
  if (!getSupabaseEnv()) {
    return {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const stripeResult = createStripeClient();

  if (!stripeResult.ok) {
    return { error: stripeResult.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { error: error.message };
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
    return { error: profileError.message };
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
    return { error: "No Stripe customer is linked to this account." };
  }

  const origin = await getAuthOrigin();
  let portalUrl: string;

  try {
    const session = await stripeResult.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    if (!session.url) {
      return { error: "Stripe did not return a billing portal URL." };
    }

    portalUrl = session.url;
  } catch (caught) {
    const message =
      caught instanceof Error && caught.message
        ? caught.message
        : "Unable to open the Stripe billing portal.";

    return { error: message };
  }

  redirect(portalUrl);
}
