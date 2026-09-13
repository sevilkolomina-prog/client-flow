import Stripe from "stripe";

import { type PaidPlanId } from "@/lib/billing/plans";
import { logServerError } from "@/lib/errors";

type StripeServerEnv = {
  secretKey: string;
  priceIds: Record<PaidPlanId, string>;
};

type StripeEnvResult =
  | { ok: true; env: StripeServerEnv }
  | { ok: false; error: string };

const PAID_PRICE_AMOUNT: Record<PaidPlanId, number> = {
  pro: 1900,
  business: 4900,
};

function isLiveStripeKey(secretKey: string) {
  return secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_");
}

function readServerEnv(name: string) {
  return process.env[name];
}

function normalizeEnvValue(value: string | undefined) {
  if (!value) {
    return "";
  }

  let normalized = value.trim().replace(/^\uFEFF/, "");

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  const accidentalPrefix = normalized.match(
    /^(?:STRIPE_)?(?:PRO_|BUSINESS_)?PRICE_ID=/i
  );

  if (accidentalPrefix) {
    normalized = normalized.slice(accidentalPrefix[0].length).trim();
  }

  return normalized;
}

export function getStripeServerEnv(): StripeEnvResult {
  const secretKey = normalizeEnvValue(readServerEnv("STRIPE_SECRET_KEY"));
  const proPriceId = normalizeEnvValue(readServerEnv("STRIPE_PRO_PRICE_ID"));
  const businessPriceId = normalizeEnvValue(
    readServerEnv("STRIPE_BUSINESS_PRICE_ID")
  );

  const missing: string[] = [];

  if (!secretKey) {
    missing.push("STRIPE_SECRET_KEY");
  }

  if (!proPriceId) {
    missing.push("STRIPE_PRO_PRICE_ID");
  }

  if (!businessPriceId) {
    missing.push("STRIPE_BUSINESS_PRICE_ID");
  }

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Stripe sandbox is not configured. Missing ${missing.join(", ")} on the server.`,
    };
  }

  if (isLiveStripeKey(secretKey)) {
    return {
      ok: false,
      error:
        "Stripe live keys are not allowed. Use a sandbox/test secret key.",
    };
  }

  if (!proPriceId.startsWith("price_") || !businessPriceId.startsWith("price_")) {
    return {
      ok: false,
      error:
        "STRIPE_PRO_PRICE_ID and STRIPE_BUSINESS_PRICE_ID must be Stripe price IDs.",
    };
  }

  return {
    ok: true,
    env: {
      secretKey,
      priceIds: {
        pro: proPriceId,
        business: businessPriceId,
      },
    },
  };
}

export function createStripeClient() {
  const result = getStripeServerEnv();

  if (!result.ok) {
    return result;
  }

  return {
    ok: true as const,
    stripe: new Stripe(result.env.secretKey),
    priceIds: result.env.priceIds,
  };
}

export async function assertCheckoutPrice(
  stripe: Stripe,
  plan: PaidPlanId,
  priceId: string
): Promise<{ error?: string }> {
  let price: Stripe.Price;

  try {
    price = await stripe.prices.retrieve(priceId);
  } catch (caught) {
    logServerError("billing-price", caught);
    return { error: "Unable to load the Stripe price." };
  }

  const expectedAmount = PAID_PRICE_AMOUNT[plan];

  if (!price.active) {
    return { error: `The ${plan} Stripe price is not active.` };
  }

  if (price.type !== "recurring" || price.recurring?.interval !== "month") {
    return { error: `The ${plan} Stripe price must be a monthly recurring price.` };
  }

  if (price.currency !== "usd") {
    return { error: `The ${plan} Stripe price must use USD.` };
  }

  if (price.unit_amount !== expectedAmount) {
    return {
      error: `The ${plan} Stripe price amount does not match the ClientFlow plan.`,
    };
  }

  return {};
}

export function getStripeWebhookSecret() {
  const secret = normalizeEnvValue(readServerEnv("STRIPE_WEBHOOK_SECRET"));

  if (!secret || !secret.startsWith("whsec_")) {
    return null;
  }

  return secret;
}

export function planFromStripePriceId(priceId: string | null | undefined) {
  if (!priceId) {
    return null;
  }

  const env = getStripeServerEnv();

  if (!env.ok) {
    return null;
  }

  if (priceId === env.env.priceIds.pro) {
    return "pro" as const;
  }

  if (priceId === env.env.priceIds.business) {
    return "business" as const;
  }

  return null;
}
