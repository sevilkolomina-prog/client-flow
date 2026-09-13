import { APP_CONFIG_ERROR } from "@/lib/errors";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(APP_CONFIG_ERROR);
  }

  return env;
}
