import { isPaidPlan, parsePlan, type PlanId } from "@/lib/billing/plans";

export const FREE_CLIENT_LIMIT = 3;
export const FREE_PROJECT_LIMIT = 3;

export const FREE_CLIENT_LIMIT_MESSAGE =
  "Free plan allows up to 3 clients. Upgrade to Pro to add more.";

export const FREE_PROJECT_LIMIT_MESSAGE =
  "Free plan allows up to 3 projects. Upgrade to Pro to add more.";

export function hasReachedFreePlanLimit(
  plan: PlanId | null | undefined,
  count: number,
  limit: number
) {
  if (plan == null || isPaidPlan(parsePlan(plan))) {
    return false;
  }

  return count >= limit;
}
