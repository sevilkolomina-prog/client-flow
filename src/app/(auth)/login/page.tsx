import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to manage your clients, projects, and invoices."
    >
      <LoginForm />
    </AuthCard>
  );
}
