"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isBusinessType } from "@/components/onboarding/data";
import { DASHBOARD_PATH } from "@/lib/onboarding/home-path";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type OnboardingActionState = {
  error?: string;
};

function missingConfigState(): OnboardingActionState {
  return {
    error:
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
  };
}

export async function completeOnboarding(
  _prev: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  if (!getSupabaseEnv()) {
    return missingConfigState();
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const businessType = String(formData.get("businessType") ?? "").trim();

  if (!fullName || !companyName || !phone || !businessType) {
    return { error: "All fields are required." };
  }

  if (!isBusinessType(businessType)) {
    return { error: "Select a valid business type." };
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError.message };
  }

  if (!data.user) {
    redirect("/login");
  }

  const payload = {
    full_name: fullName,
    company_name: companyName,
    phone,
    business_type: businessType,
    onboarding_complete: true,
  };

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", data.user.id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: data.user.id,
      ...payload,
    });

    if (insertError) {
      return { error: insertError.message };
    }
  }

  await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  revalidatePath("/", "layout");
  redirect(DASHBOARD_PATH);
}
