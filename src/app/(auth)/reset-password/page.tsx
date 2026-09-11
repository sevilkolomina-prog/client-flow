import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Choose a new password for your ClientFlow account."
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
