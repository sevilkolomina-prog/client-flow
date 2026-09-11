import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { DASHBOARD_PATH } from "@/lib/onboarding/home-path";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Onboarding",
};

export default async function OnboardingPage() {
  if (!getSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name, phone, business_type, onboarding_complete")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.onboarding_complete === true) {
    redirect(DASHBOARD_PATH);
  }

  const metadataName =
    typeof data.user.user_metadata?.full_name === "string"
      ? data.user.user_metadata.full_name
      : "";

  return (
    <AuthCard
      title="Set up your workspace"
      description="Tell us a bit about your business before you start using ClientFlow."
    >
      <OnboardingForm
        fullName={profile?.full_name || metadataName}
        companyName={profile?.company_name ?? ""}
        phone={profile?.phone ?? ""}
        businessType={profile?.business_type ?? ""}
      />
    </AuthCard>
  );
}
