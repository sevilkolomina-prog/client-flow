export const PLAN_IDS = ["free", "pro", "business"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For getting started with ClientFlow.",
    features: [
      "Up to 3 clients",
      "Up to 3 projects",
      "Basic invoices",
      "Dashboard",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For growing independent businesses.",
    features: [
      "Unlimited clients",
      "Unlimited projects",
      "Unlimited invoices",
      "Full dashboard",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$49",
    period: "/month",
    description: "For teams that need more from ClientFlow.",
    features: [
      "Everything in Pro",
      "Team features placeholder",
      "Advanced reporting placeholder",
      "Priority support",
    ],
  },
];

export type PaidPlanId = Exclude<PlanId, "free">;

export function isPaidPlan(value: unknown): value is PaidPlanId {
  return value === "pro" || value === "business";
}

export function parsePlan(value: unknown): PlanId {
  if (value === "pro" || value === "business" || value === "free") {
    return value;
  }

  return "free";
}

export function planLabel(plan: PlanId) {
  switch (plan) {
    case "pro":
      return "Pro";
    case "business":
      return "Business";
    default:
      return "Free";
  }
}

export function subscriptionStatusLabel(status: string | null | undefined) {
  const trimmed = status?.trim();

  if (!trimmed) {
    return "None";
  }

  switch (trimmed.toLowerCase()) {
    case "active":
      return "Active";
    case "trialing":
      return "Trialing";
    case "past_due":
      return "Past due";
    case "canceled":
    case "cancelled":
      return "Canceled";
    case "unpaid":
      return "Unpaid";
    case "incomplete":
      return "Incomplete";
    case "incomplete_expired":
      return "Expired";
    case "paused":
      return "Paused";
    default:
      return trimmed.replace(/_/g, " ");
  }
}
