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

export type CreateClientResult = {
  client?: Client;
  error?: string;
};

export async function createClientRecord(
  values: ClientFormValues
): Promise<CreateClientResult> {
  try {
    const name = values.name.trim();
    const company = values.company.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();

    if (!name || !company || !email || !phone) {
      return { error: "All client fields are required." };
    }

    if (!isClientStatus(values.status)) {
      return { error: "Select a valid client status." };
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
      return {
        error: asLimitOrFallback(
          error,
          FREE_CLIENT_LIMIT_MESSAGE,
          "Unable to add client."
        ),
      };
    }

    return { client: mapClientRow(data as ClientRow) };
  } catch (caught: unknown) {
    return {
      error: asLimitOrFallback(
        caught,
        FREE_CLIENT_LIMIT_MESSAGE,
        "Unable to add client."
      ),
    };
  }
}
