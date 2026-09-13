import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  PASSWORD_RECOVERY_COOKIE,
  activeRecoveryCookieOptions,
  isPasswordRecoveryRequest,
} from "@/lib/auth/recovery-cookie";
import {
  DASHBOARD_PATH,
  ONBOARDING_PATH,
  asProfilesClient,
  getSignedInHomePath,
} from "@/lib/onboarding/home-path";
import { getSupabaseEnv } from "@/lib/supabase/env";

const protectedPaths = [
  "/dashboard",
  "/clients",
  "/projects",
  "/invoices",
  "/pricing",
  "/settings",
  "/onboarding",
];

const appPaths = [
  "/dashboard",
  "/clients",
  "/projects",
  "/invoices",
  "/pricing",
  "/settings",
];

function isProtectedPath(pathname: string) {
  return protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isAppPath(pathname: string) {
  return appPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function claimsUserId(claims: { sub?: unknown } | null | undefined) {
  return typeof claims?.sub === "string" ? claims.sub : null;
}

function isAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password"
  );
}

function isRecoveryPath(pathname: string) {
  return pathname === "/reset-password" || pathname === "/auth/recovery";
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  source: NextResponse
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const response = NextResponse.redirect(url);

  source.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  if (request.cookies.get(PASSWORD_RECOVERY_COOKIE)?.value === "1") {
    response.cookies.set(
      PASSWORD_RECOVERY_COOKIE,
      "1",
      activeRecoveryCookieOptions()
    );
  }

  return response;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname === "/api/stripe/webhook" ||
    pathname.startsWith("/api/stripe/webhook/")
  ) {
    return NextResponse.next({ request });
  }

  const env = getSupabaseEnv();
  const isRecovery = isPasswordRecoveryRequest({
    searchParams: request.nextUrl.searchParams,
    cookies: request.cookies,
  });

  if (!env) {
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const recoveryPath = isRecoveryPath(pathname);

  if (
    (code || tokenHash) &&
    pathname !== "/auth/callback" &&
    pathname !== "/auth/recovery"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = recoveryPath || isRecovery ? "/auth/recovery" : "/auth/callback";
    if (recoveryPath || isRecovery) {
      url.searchParams.set("next", "/reset-password");
    } else if (!url.searchParams.get("next")) {
      url.searchParams.set("next", "/dashboard");
    }
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value)
        );
      },
    },
  });

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const recovering =
    isRecovery ||
    recoveryPath ||
    request.cookies.get(PASSWORD_RECOVERY_COOKIE)?.value === "1";

  if (user && pathname === "/reset-password") {
    return supabaseResponse;
  }

  if (
    user &&
    recovering &&
    pathname !== "/reset-password" &&
    pathname !== "/auth/callback" &&
    pathname !== "/auth/recovery"
  ) {
    return redirectWithCookies(request, "/reset-password", supabaseResponse);
  }

  if (!user && isProtectedPath(pathname)) {
    return redirectWithCookies(request, "/login", supabaseResponse);
  }

  const homePath = user
    ? await getSignedInHomePath(asProfilesClient(supabase), claimsUserId(user))
    : DASHBOARD_PATH;

  if (user && isAuthPath(pathname)) {
    return redirectWithCookies(
      request,
      recovering ? "/reset-password" : homePath,
      supabaseResponse
    );
  }

  if (user && !recovering && isAppPath(pathname) && homePath === ONBOARDING_PATH) {
    return redirectWithCookies(request, ONBOARDING_PATH, supabaseResponse);
  }

  if (
    user &&
    !recovering &&
    (pathname === ONBOARDING_PATH || pathname.startsWith(`${ONBOARDING_PATH}/`)) &&
    homePath === DASHBOARD_PATH
  ) {
    return redirectWithCookies(request, DASHBOARD_PATH, supabaseResponse);
  }

  return supabaseResponse;
}
