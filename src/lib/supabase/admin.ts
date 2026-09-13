import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";

function readServerEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function getSupabaseServiceRoleKey() {
  const key = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!key || key.startsWith("NEXT_PUBLIC_")) {
    return null;
  }

  return key;
}

export function createAdminClient() {
  const env = getSupabaseEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!env || !serviceRoleKey) {
    throw new Error(
      "Supabase service role is not configured. Add SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(env.url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
