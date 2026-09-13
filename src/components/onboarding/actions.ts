"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isBusinessType } from "@/components/onboarding/data";
import { APP_CONFIG_ERROR, toUserFacingError } from "@/lib/errors";
import { DASHBOARD_PATH } from "@/lib/onboarding/home-path";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type OnboardingActionState = {
  error?: string;
};

function missingConfigState(): OnboardingActionState {
  return { error: APP_CONFIG_ERROR };
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
    return { error: toUserFacingError(userError, "You must be logged in.") };
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
    return {
      error: toUserFacingError(updateError, "Unable to save onboarding."),
    };
  }

  if (!updated) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: data.user.id,
      ...payload,
    });

    if (insertError) {
      return {
        error: toUserFacingError(insertError, "Unable to save onboarding."),
      };
    }
  }

  await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  revalidatePath("/", "layout");
  redirect(DASHBOARD_PATH);
}
