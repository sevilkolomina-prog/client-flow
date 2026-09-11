import { NextResponse } from "next/server";

import { PRODUCTION_SITE_URL } from "@/lib/auth/origin";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

function safeNextPath(value: string | null) {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/reset-password";
}

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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"));
  const base = redirectBase(request, origin);
  const errorRedirect = `${base}/forgot-password?error=invalid`;

  if (!getSupabaseEnv()) {
    return NextResponse.redirect(errorRedirect);
  }

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(errorRedirect);
    }

    return NextResponse.redirect(`${base}${next}`);
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

    return NextResponse.redirect(`${base}${next}`);
  }

  return NextResponse.redirect(errorRedirect);
}
