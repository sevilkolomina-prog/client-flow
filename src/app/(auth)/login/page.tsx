import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to manage your clients, projects, and invoices."
    >
      <LoginForm resetSuccess={params.reset === "success"} />
    </AuthCard>
  );
}
