import { headers } from "next/headers";

export const PRODUCTION_SITE_URL = "https://client-flow-neon.vercel.app";
export const LOCAL_AUTH_ORIGIN = "http://localhost:3001";

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

export async function getAuthOrigin() {
  if (isVercelRuntime()) {
    return PRODUCTION_SITE_URL;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return stripTrailingSlash(configured);
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) {
    return stripTrailingSlash(origin);
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${stripTrailingSlash(host)}`;
  }

  return LOCAL_AUTH_ORIGIN;
}

export function getPasswordResetRedirectTo(origin: string) {
  return `${origin}/auth/callback`;
}
