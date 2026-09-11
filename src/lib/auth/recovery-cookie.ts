export const PASSWORD_RECOVERY_COOKIE = "cf-password-recovery";
export const PASSWORD_RESET_PENDING_COOKIE = "cf-password-reset-pending";

export const recoveryCookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function pendingResetCookieOptions() {
  return {
    ...recoveryCookieOptions,
    maxAge: 60 * 60,
  };
}

export function activeRecoveryCookieOptions() {
  return {
    ...recoveryCookieOptions,
    maxAge: 60 * 10,
  };
}

export function expireCookieOptions() {
  return {
    ...recoveryCookieOptions,
    maxAge: 0,
  };
}

export function isPasswordRecoveryRequest(input: {
  searchParams: URLSearchParams;
  cookies: { get(name: string): { value: string } | undefined };
}) {
  const type = input.searchParams.get("type");
  const next = input.searchParams.get("next");

  return (
    type === "recovery" ||
    next === "/reset-password" ||
    input.cookies.get(PASSWORD_RECOVERY_COOKIE)?.value === "1" ||
    input.cookies.get(PASSWORD_RESET_PENDING_COOKIE)?.value === "1"
  );
}
