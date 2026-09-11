import { parsePlan, type PlanId } from "@/lib/billing/plans";

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  phone: string;
  plan: PlanId;
  subscriptionStatus: string | null;
};

export type ProfileFormValues = {
  fullName: string;
  companyName: string;
  phone: string;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  plan?: string | null;
  subscription_status?: string | null;
  created_at: string;
  updated_at: string;
};

export function mapProfileRow(row: ProfileRow, email: string): Profile {
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    email,
    companyName: row.company_name ?? "",
    phone: row.phone ?? "",
    plan: parsePlan(row.plan),
    subscriptionStatus: row.subscription_status ?? null,
  };
}
