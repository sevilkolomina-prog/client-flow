import type Stripe from "stripe";

import { planFromStripePriceId } from "@/lib/billing/stripe";
import type { PlanId } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PAID_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

type SubscriptionFields = {
  plan: PlanId;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
};

type ProfileLookupRow = {
  id?: string | null;
  stripe_subscription_id?: string | null;
  plan?: string | null;
  stripe_customer_id?: string | null;
  subscription_status?: string | null;
  subscription_current_period_end?: string | null;
};

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function asId(value: unknown) {
  if (typeof value === "string" && value) {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }

  return null;
}

function subscriptionPriceIds(subscription: Stripe.Subscription) {
  return (subscription.items?.data ?? [])
    .map((item) => asId(item.price))
    .filter((id): id is string => Boolean(id));
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0] as
    | { current_period_end?: number }
    | undefined;
  const seconds =
    item?.current_period_end ??
    (subscription as { current_period_end?: number }).current_period_end;

  if (!seconds) {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
}

function planFromSubscription(subscription: Stripe.Subscription) {
  for (const priceId of subscriptionPriceIds(subscription)) {
    const plan = planFromStripePriceId(priceId);
    if (plan) {
      return plan;
    }
  }

  return null;
}

function sameInstant(
  left: string | null | undefined,
  right: string | null | undefined
) {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);

  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
    return left === right;
  }

  return leftTime === rightTime;
}

async function findProfileId(options: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) {
  const admin = createAdminClient();

  if (options.userId && isUuid(options.userId)) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("id", options.userId)
      .maybeSingle();

    if (data?.id) {
      return data.id as string;
    }

    const { data: created, error } = await admin
      .from("profiles")
      .insert({ id: options.userId })
      .select("id")
      .maybeSingle();

    if (created?.id) {
      return created.id as string;
    }

    if (error?.code === "23505") {
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("id", options.userId)
        .maybeSingle();

      if (existing?.id) {
        return existing.id as string;
      }
    }
  }

  if (options.subscriptionId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_subscription_id", options.subscriptionId)
      .maybeSingle();

    if (data?.id) {
      return data.id as string;
    }
  }

  if (options.customerId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", options.customerId)
      .maybeSingle();

    if (data?.id) {
      return data.id as string;
    }
  }

  return null;
}

async function updateProfileSubscription(
  profileId: string,
  fields: SubscriptionFields
) {
  const admin = createAdminClient();
  const { data, error: readError } = await admin
    .from("profiles")
    .select(
      "plan, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end"
    )
    .eq("id", profileId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  const current = data as ProfileLookupRow | null;

  if (
    current &&
    current.plan === fields.plan &&
    current.stripe_customer_id === fields.stripe_customer_id &&
    current.stripe_subscription_id === fields.stripe_subscription_id &&
    current.subscription_status === fields.subscription_status &&
    sameInstant(
      current.subscription_current_period_end,
      fields.subscription_current_period_end
    )
  ) {
    return;
  }

  const { error } = await admin
    .from("profiles")
    .update(fields)
    .eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }
}

async function applyPaidSubscription(
  subscription: Stripe.Subscription,
  userId?: string | null
) {
  const customerId = asId(subscription.customer);
  const subscriptionId = subscription.id;
  const profileId = await findProfileId({
    userId,
    customerId,
    subscriptionId,
  });

  if (!profileId) {
    return;
  }

  if (!PAID_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return;
  }

  const plan = planFromSubscription(subscription);

  if (!plan) {
    return;
  }

  await updateProfileSubscription(profileId, {
    plan,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    subscription_status: subscription.status,
    subscription_current_period_end: subscriptionPeriodEnd(subscription),
  });
}

async function applyDeletedSubscription(subscription: Stripe.Subscription) {
  const customerId = asId(subscription.customer);
  const subscriptionId = subscription.id;
  const userId =
    typeof subscription.metadata?.supabase_user_id === "string"
      ? subscription.metadata.supabase_user_id
      : null;
  const profileId = await findProfileId({
    userId,
    customerId,
    subscriptionId,
  });

  if (!profileId) {
    return;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", profileId)
    .maybeSingle();

  const current = data as ProfileLookupRow | null;

  if (
    current?.stripe_subscription_id &&
    current.stripe_subscription_id !== subscriptionId
  ) {
    return;
  }

  await updateProfileSubscription(profileId, {
    plan: "free",
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    subscription_status: subscription.status || "canceled",
    subscription_current_period_end: subscriptionPeriodEnd(subscription),
  });
}

export async function handleStripeEvent(
  event: Stripe.Event,
  stripe: Stripe
) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode !== "subscription" || session.status !== "complete") {
        return;
      }

      const userId =
        (typeof session.client_reference_id === "string"
          ? session.client_reference_id
          : null) ||
        (typeof session.metadata?.supabase_user_id === "string"
          ? session.metadata.supabase_user_id
          : null);

      const subscriptionId = asId(session.subscription);

      if (!subscriptionId) {
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });
      await applyPaidSubscription(subscription, userId);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const incoming = event.data.object as Stripe.Subscription;
      const subscription = await stripe.subscriptions.retrieve(incoming.id, {
        expand: ["items.data.price"],
      });
      const userId =
        typeof subscription.metadata?.supabase_user_id === "string"
          ? subscription.metadata.supabase_user_id
          : typeof incoming.metadata?.supabase_user_id === "string"
            ? incoming.metadata.supabase_user_id
            : null;

      if (
        subscription.status === "canceled" ||
        subscription.status === "incomplete_expired"
      ) {
        await applyDeletedSubscription(subscription);
        return;
      }

      await applyPaidSubscription(subscription, userId);
      return;
    }
    case "customer.subscription.deleted": {
      await applyDeletedSubscription(
        event.data.object as Stripe.Subscription
      );
      return;
    }
    default:
      return;
  }
}
