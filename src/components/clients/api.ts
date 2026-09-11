"use client";

import { createClient } from "@/lib/supabase/client";
import {
  mapClientRow,
  type Client,
  type ClientFormValues,
  type ClientRow,
} from "@/components/clients/data";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

async function requireUserId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("You must be logged in to manage clients.");
  }

  return { supabase, userId: data.user.id };
}

export async function fetchClients(): Promise<Client[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, user_id, full_name, company, email, phone, status, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ClientRow[]).map(mapClientRow);
}

export async function createClientRecord(
  values: ClientFormValues
): Promise<Client> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: userId,
      full_name: values.name.trim(),
      company: values.company.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      status: values.status,
    })
    .select(
      "id, user_id, full_name, company, email, phone, status, created_at, updated_at"
    )
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to add client."));
  }

  return mapClientRow(data as ClientRow);
}

export async function updateClientRecord(
  id: string,
  values: ClientFormValues
): Promise<Client> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("clients")
    .update({
      full_name: values.name.trim(),
      company: values.company.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      status: values.status,
    })
    .eq("id", id)
    .select(
      "id, user_id, full_name, company, email, phone, status, created_at, updated_at"
    )
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to update client."));
  }

  return mapClientRow(data as ClientRow);
}

export async function deleteClientRecord(id: string) {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to delete client."));
  }
}
