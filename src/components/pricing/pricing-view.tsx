"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { fetchOrCreateProfile } from "@/components/settings/api";
import { createCheckoutSession } from "@/lib/billing/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  isPaidPlan,
  parsePlan,
  plans,
  type PaidPlanId,
  type PlanId,
} from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

type PricingViewProps = {
  checkout?: string | null;
};

function checkoutNotice(checkout: string | null | undefined) {
  if (checkout === "success") {
    return "Payment received. We are confirming your subscription.";
  }

  if (checkout === "cancelled") {
    return "Checkout was cancelled. Your plan was not changed.";
  }

  return null;
}

export function PricingView({ checkout = null }: PricingViewProps) {
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<PaidPlanId | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const paidCheckout = isPaidPlan(currentPlan);
  const notice =
    checkout === "success"
      ? paidCheckout
        ? "Your subscription is active."
        : "Payment received. We are confirming your subscription."
      : checkoutNotice(checkout);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(retries: number) {
      try {
        const profile = await fetchOrCreateProfile();

        if (cancelled) {
          return;
        }

        setCurrentPlan(parsePlan(profile.plan));
        setError(null);
        setLoading(false);

        if (
          checkout === "success" &&
          retries > 0 &&
          !isPaidPlan(parsePlan(profile.plan))
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          if (!cancelled) {
            await loadProfile(retries - 1);
          }
        }
      } catch (caught: unknown) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load your current plan."
          );
          setLoading(false);
        }
      }
    }

    void loadProfile(checkout === "success" ? 8 : 0);

    return () => {
      cancelled = true;
    };
  }, [checkout]);

  function handleUpgrade(planId: PlanId) {
    if (!isPaidPlan(planId) || planId === currentPlan || pending) {
      return;
    }

    setError(null);
    setPendingPlan(planId);
    startTransition(async () => {
      const result = await createCheckoutSession(planId);

      if (result?.error) {
        setError(result.error);
        setPendingPlan(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
        <p className="text-muted-foreground">
          Choose the plan that fits your business. Checkout uses Stripe sandbox.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {notice ? (
        <p
          role="status"
          className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
        >
          {notice}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isCheckoutPending = pending && pendingPlan === plan.id;
          const buttonLabel = isCurrent
            ? "Current Plan"
            : isCheckoutPending
              ? "Redirecting to checkout..."
              : plan.id === "pro"
                ? "Upgrade to Pro"
                : plan.id === "business"
                  ? "Upgrade to Business"
                  : "Free";

          return (
            <Card
              key={plan.id}
              className={cn(
                "bg-card shadow-xs",
                plan.highlighted ? "ring-2 ring-primary" : undefined
              )}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <p className="pt-2 text-3xl font-semibold tracking-tight">
                  {plan.price}
                  <span className="text-sm font-medium text-muted-foreground">
                    {plan.period}
                  </span>
                </p>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto flex-col items-stretch gap-2 border-t-0 bg-transparent">
                <Button
                  type="button"
                  className="w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={
                    loading || pending || isCurrent || plan.id === "free"
                  }
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {loading || isCheckoutPending ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : null}
                  {buttonLabel}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
