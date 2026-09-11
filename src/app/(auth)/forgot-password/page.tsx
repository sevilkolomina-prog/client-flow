import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Forgot password"
      description="Enter your email and we'll send you a link to reset your password."
    >
      <ForgotPasswordForm invalidLink={params.error === "invalid"} />
    </AuthCard>
  );
}
