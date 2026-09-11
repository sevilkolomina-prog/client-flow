export type Profile = {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  phone: string;
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
  };
}
