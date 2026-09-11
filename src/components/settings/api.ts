"use client";

import { createClient } from "@/lib/supabase/client";
import {
  mapProfileRow,
  type Profile,
  type ProfileFormValues,
  type ProfileRow,
} from "@/components/settings/data";

const profileSelect = "id, full_name, company_name, phone, created_at, updated_at";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

function metadataFullName(user: {
  user_metadata?: Record<string, unknown>;
}) {
  return typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : "";
}

async function requireUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("You must be logged in to manage your profile.");
  }

  return { supabase, user: data.user };
}

export async function fetchOrCreateProfile(): Promise<Profile> {
  const { supabase, user } = await requireUser();
  const email = user.email ?? "";

  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to load profile."));
  }

  if (data) {
    return mapProfileRow(data as ProfileRow, email);
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: metadataFullName(user),
      company_name: "",
      phone: "",
    })
    .select(profileSelect)
    .single();

  if (insertError?.code === "23505") {
    const { data: existing, error: refetchError } = await supabase
      .from("profiles")
      .select(profileSelect)
      .eq("id", user.id)
      .single();

    if (refetchError) {
      throw new Error(getErrorMessage(refetchError, "Unable to load profile."));
    }

    return mapProfileRow(existing as ProfileRow, email);
  }

  if (insertError) {
    throw new Error(getErrorMessage(insertError, "Unable to create profile."));
  }

  return mapProfileRow(created as ProfileRow, email);
}

export async function updateProfileRecord(
  values: ProfileFormValues
): Promise<Profile> {
  const { supabase, user } = await requireUser();
  const payload = {
    full_name: values.fullName.trim(),
    company_name: values.companyName.trim(),
    phone: values.phone.trim(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select(profileSelect)
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to save profile."));
  }

  await supabase.auth.updateUser({
    data: { full_name: payload.full_name },
  });

  return mapProfileRow(data as ProfileRow, user.email ?? "");
}
