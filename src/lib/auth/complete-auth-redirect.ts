import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { PRODUCTION_SITE_URL } from "@/lib/auth/origin";
import {
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RESET_PENDING_COOKIE,
  activeRecoveryCookieOptions,
  expireCookieOptions,
  isPasswordRecoveryRequest,
} from "@/lib/auth/recovery-cookie";
import { asProfilesClient, getSignedInHomePath } from "@/lib/onboarding/home-path";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

function redirectBase(request: Request, origin: string) {
  if (process.env.VERCEL) {
    return PRODUCTION_SITE_URL;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return origin;
  }

  if (forwardedHost) {
    return `https://${forwardedHost}`;
  }

  return origin;
}

function applyRecoveryCookies(response: NextResponse, isRecovery: boolean) {
  if (isRecovery) {
    response.cookies.set(
      PASSWORD_RECOVERY_COOKIE,
      "1",
      activeRecoveryCookieOptions()
    );
    return;
  }

  response.cookies.set(PASSWORD_RECOVERY_COOKIE, "", expireCookieOptions());
  response.cookies.set(
    PASSWORD_RESET_PENDING_COOKIE,
    "",
    expireCookieOptions()
  );
}

export async function completeAuthRedirect(
  request: Request,
  options?: { forceRecovery?: boolean }
) {
  const { searchParams, origin } = new URL(request.url);
  const cookieStore = await cookies();
  const isRecovery =
    options?.forceRecovery ||
    isPasswordRecoveryRequest({
      searchParams,
      cookies: cookieStore,
    });
  const base = redirectBase(request, origin);
  const errorRedirect = isRecovery
    ? `${base}/forgot-password?error=invalid`
    : `${base}/login`;

  if (!getSupabaseEnv()) {
    return NextResponse.redirect(errorRedirect);
  }

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  async function signedInNextPath() {
    if (isRecovery) {
      return "/reset-password";
    }

    const { data } = await supabase.auth.getUser();
    return getSignedInHomePath(asProfilesClient(supabase), data.user?.id);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(errorRedirect);
    }

    const response = NextResponse.redirect(`${base}${await signedInNextPath()}`);
    applyRecoveryCookies(response, isRecovery);
    return response;
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as
        | "recovery"
        | "email"
        | "signup"
        | "invite"
        | "magiclink"
        | "email_change",
      token_hash: tokenHash,
    });

    if (error) {
      return NextResponse.redirect(errorRedirect);
    }

    const response = NextResponse.redirect(`${base}${await signedInNextPath()}`);
    applyRecoveryCookies(response, isRecovery);
    return response;
  }

  if (isRecovery) {
    const response = NextResponse.redirect(`${base}/reset-password`);
    applyRecoveryCookies(response, true);
    return response;
  }

  return NextResponse.redirect(errorRedirect);
}
