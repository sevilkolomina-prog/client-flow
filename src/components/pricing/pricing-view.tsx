"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { fetchOrCreateProfile } from "@/components/settings/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parsePlan, plans, type PlanId } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export function PricingView() {
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchOrCreateProfile()
      .then((profile) => {
        if (!cancelled) {
          setCurrentPlan(parsePlan(profile.plan));
          setError(null);
          setLoading(false);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load your current plan."
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleUpgrade(planId: PlanId) {
    if (planId === currentPlan) {
      return;
    }

    setNotice("Payments coming next");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
        <p className="text-muted-foreground">
          Choose the plan that fits your business. Payments are not enabled yet.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
          const buttonLabel = isCurrent
            ? "Current Plan"
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
                  disabled={loading || isCurrent || plan.id === "free"}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {loading ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : null}
                  {buttonLabel}
                </Button>
                {plan.id !== "free" ? (
                  <p className="text-center text-xs text-muted-foreground">
                    Payments coming next
                  </p>
                ) : null}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
