"use client";

import { createClient } from "@/lib/supabase/client";
import {
  mapInvoiceRow,
  nextInvoiceNumber,
  type Invoice,
  type InvoiceFormValues,
  type InvoiceRow,
  type InvoiceStatus,
} from "@/components/invoices/data";
import { toUserFacingError } from "@/lib/errors";

const invoiceSelect = `
  id,
  user_id,
  client_id,
  project_id,
  invoice_number,
  amount,
  status,
  issue_date,
  due_date,
  notes,
  created_at,
  updated_at,
  client:clients (
    id,
    full_name,
    company
  ),
  project:projects (
    id,
    name
  )
`;

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "An invoice with that number already exists.";
  }

  return toUserFacingError(error, fallback);
}

async function requireUserId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(
      toUserFacingError(error, "You must be logged in to manage invoices.")
    );
  }

  if (!data.user) {
    throw new Error("You must be logged in to manage invoices.");
  }

  return { supabase, userId: data.user.id };
}

function toInvoicePayload(
  userId: string,
  values: InvoiceFormValues,
  invoiceNumber: string
) {
  const amount = Number(values.amount);

  return {
    user_id: userId,
    client_id: values.clientId,
    project_id: values.projectId,
    invoice_number: invoiceNumber,
    amount: Number.isFinite(amount) ? amount : 0,
    status: values.status,
    issue_date: values.issueDate,
    due_date: values.dueDate,
    notes: values.notes.trim(),
  };
}

async function fetchInvoiceNumbers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number");

  if (error) {
    throw new Error(toUserFacingError(error, "Unable to load invoices."));
  }

  return (data ?? []).map((row) => ({
    number: String(row.invoice_number ?? ""),
  }));
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(toUserFacingError(error, "Unable to load invoices."));
  }

  return (data as InvoiceRow[]).map(mapInvoiceRow);
}

export async function createInvoiceRecord(
  values: InvoiceFormValues
): Promise<Invoice> {
  const { supabase, userId } = await requireUserId();

  async function insertWithNumber(invoiceNumber: string) {
    return supabase
      .from("invoices")
      .insert(toInvoicePayload(userId, values, invoiceNumber))
      .select(invoiceSelect)
      .single();
  }

  const firstNumber = nextInvoiceNumber(await fetchInvoiceNumbers());
  let { data, error } = await insertWithNumber(firstNumber);

  if (error?.code === "23505") {
    const retryNumber = nextInvoiceNumber(await fetchInvoiceNumbers());
    ({ data, error } = await insertWithNumber(retryNumber));
  }

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to add invoice."));
  }

  return mapInvoiceRow(data as InvoiceRow);
}

export async function updateInvoiceRecord(
  id: string,
  values: InvoiceFormValues,
  invoiceNumber: string
): Promise<Invoice> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("invoices")
    .update(toInvoicePayload(userId, values, invoiceNumber))
    .eq("id", id)
    .select(invoiceSelect)
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to update invoice."));
  }

  return mapInvoiceRow(data as InvoiceRow);
}

export async function markInvoicePaid(id: string): Promise<Invoice> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "Paid" satisfies InvoiceStatus })
    .eq("id", id)
    .select(invoiceSelect)
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to mark invoice as paid."));
  }

  return mapInvoiceRow(data as InvoiceRow);
}

export async function deleteInvoiceRecord(id: string) {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to delete invoice."));
  }
}
