import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <AuthCard
      title="Create an account"
      description="Start managing your clients, projects, and invoices."
    >
      <SignupForm />
    </AuthCard>
  );
}
