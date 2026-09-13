"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthOrigin, getPasswordResetRedirectTo } from "@/lib/auth/origin";
import { APP_CONFIG_ERROR, toUserFacingError } from "@/lib/errors";
import {
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RESET_PENDING_COOKIE,
  expireCookieOptions,
  pendingResetCookieOptions,
} from "@/lib/auth/recovery-cookie";
import { asProfilesClient, getSignedInHomePath } from "@/lib/onboarding/home-path";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function missingConfigState(): AuthActionState {
  return { error: APP_CONFIG_ERROR };
}

export async function login(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!getSupabaseEnv()) {
    return missingConfigState();
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: toUserFacingError(error, "Unable to log in.") };
  }

  const { data } = await supabase.auth.getUser();

  revalidatePath("/", "layout");
  redirect(await getSignedInHomePath(asProfilesClient(supabase), data.user?.id));
}

export async function signup(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!getSupabaseEnv()) {
    return missingConfigState();
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !email || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: toUserFacingError(error, "Unable to create an account.") };
  }

  if (!data.session) {
    return {
      success:
        "Account created. Check your email to confirm your account before logging in.",
    };
  }

  revalidatePath("/", "layout");
  redirect(await getSignedInHomePath(asProfilesClient(supabase), data.user?.id));
}

export async function logout() {
  if (!getSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!getSupabaseEnv()) {
    return missingConfigState();
  }

  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  const origin = await getAuthOrigin();
  const supabase = await createClient();
  const cookieStore = await cookies();
  cookieStore.set(
    PASSWORD_RESET_PENDING_COOKIE,
    "1",
    pendingResetCookieOptions()
  );
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectTo(origin),
  });

  if (error) {
    return {
      error: toUserFacingError(error, "Unable to send a password reset email."),
    };
  }

  return {
    success:
      "If an account exists for that email, we sent a password reset link.",
  };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!getSupabaseEnv()) {
    return missingConfigState();
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    return { error: "Both password fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return {
      error: toUserFacingError(
        userError,
        "This reset link is invalid or has expired. Request a new one."
      ),
    };
  }

  if (!data.user) {
    return {
      error: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: toUserFacingError(error, "Unable to update password.") };
  }

  const cookieStore = await cookies();
  cookieStore.set(PASSWORD_RECOVERY_COOKIE, "", expireCookieOptions());
  cookieStore.set(PASSWORD_RESET_PENDING_COOKIE, "", expireCookieOptions());

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?reset=success");
}
