import {
  FREE_CLIENT_LIMIT,
  FREE_CLIENT_LIMIT_MESSAGE,
  FREE_PROJECT_LIMIT,
  FREE_PROJECT_LIMIT_MESSAGE,
} from "@/lib/billing/limits";
import { isPaidPlan, parsePlan, type PlanId } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";

type AuthedProfile = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  plan: PlanId;
};

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

export function asLimitOrFallback(
  error: unknown,
  expected: string,
  fallback: string
) {
  const message = errorMessage(error, fallback);

  if (message.includes(expected)) {
    return expected;
  }

  return message;
}

export async function requireAuthedPlan(): Promise<AuthedProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("You must be logged in.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    supabase,
    userId: data.user.id,
    plan: parsePlan(profile?.plan),
  };
}

async function countOwnRows(
  supabase: AuthedProfile["supabase"],
  table: "clients" | "projects",
  userId: string
) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function assertCanCreateClient() {
  const authed = await requireAuthedPlan();

  if (isPaidPlan(authed.plan)) {
    return authed;
  }

  const count = await countOwnRows(authed.supabase, "clients", authed.userId);

  if (count >= FREE_CLIENT_LIMIT) {
    throw new Error(FREE_CLIENT_LIMIT_MESSAGE);
  }

  return authed;
}

export async function assertCanCreateProject() {
  const authed = await requireAuthedPlan();

  if (isPaidPlan(authed.plan)) {
    return authed;
  }

  const count = await countOwnRows(authed.supabase, "projects", authed.userId);

  if (count >= FREE_PROJECT_LIMIT) {
    throw new Error(FREE_PROJECT_LIMIT_MESSAGE);
  }

  return authed;
}
