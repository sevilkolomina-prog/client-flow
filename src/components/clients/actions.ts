"use server";

import {
  isClientStatus,
  mapClientRow,
  type Client,
  type ClientFormValues,
  type ClientRow,
} from "@/components/clients/data";
import {
  asLimitOrFallback,
  assertCanCreateClient,
} from "@/lib/billing/enforce";
import { FREE_CLIENT_LIMIT_MESSAGE } from "@/lib/billing/limits";

const clientSelect =
  "id, user_id, full_name, company, email, phone, status, created_at, updated_at";

export async function createClientRecord(
  values: ClientFormValues
): Promise<Client> {
  const name = values.name.trim();
  const company = values.company.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();

  if (!name || !company || !email || !phone) {
    throw new Error("All client fields are required.");
  }

  if (!isClientStatus(values.status)) {
    throw new Error("Select a valid client status.");
  }

  const { supabase, userId } = await assertCanCreateClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: userId,
      full_name: name,
      company,
      email,
      phone,
      status: values.status,
    })
    .select(clientSelect)
    .single();

  if (error) {
    throw new Error(
      asLimitOrFallback(error, FREE_CLIENT_LIMIT_MESSAGE, "Unable to add client.")
    );
  }

  return mapClientRow(data as ClientRow);
}
