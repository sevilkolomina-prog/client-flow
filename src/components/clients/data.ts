export type ClientStatus = "Active" | "Lead" | "Inactive";

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ClientStatus;
};

export type ClientFormValues = Omit<Client, "id">;

export type ClientRow = {
  id: string;
  user_id: string;
  full_name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export const clientStatuses: ClientStatus[] = ["Active", "Lead", "Inactive"];

export const clientStatusFilters = ["All", ...clientStatuses] as const;

export type ClientStatusFilter = (typeof clientStatusFilters)[number];

export function isClientStatus(value: string): value is ClientStatus {
  return clientStatuses.includes(value as ClientStatus);
}

export function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.full_name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    status: isClientStatus(row.status) ? row.status : "Active",
  };
}

export const initialClients: Client[] = [
  {
    id: "client-1",
    name: "Jordan Hale",
    company: "Acme Co",
    email: "jordan.hale@acme.co",
    phone: "(415) 555-0142",
    status: "Active",
  },
  {
    id: "client-2",
    name: "Priya Shah",
    company: "Northwind",
    email: "priya.shah@northwind.io",
    phone: "(206) 555-0198",
    status: "Active",
  },
  {
    id: "client-3",
    name: "Marcus Chen",
    company: "Globex",
    email: "marcus.chen@globex.com",
    phone: "(212) 555-0166",
    status: "Lead",
  },
  {
    id: "client-4",
    name: "Elena Rossi",
    company: "Initech",
    email: "elena.rossi@initech.com",
    phone: "(512) 555-0133",
    status: "Active",
  },
  {
    id: "client-5",
    name: "Sam Okonkwo",
    company: "Umbrella Labs",
    email: "sam.okonkwo@umbrellalabs.com",
    phone: "(617) 555-0177",
    status: "Inactive",
  },
  {
    id: "client-6",
    name: "Avery Kim",
    company: "Brightline Studio",
    email: "avery.kim@brightline.co",
    phone: "(503) 555-0119",
    status: "Lead",
  },
];

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function filterClients(
  clients: Client[],
  query: string,
  status: ClientStatusFilter = "All"
) {
  const value = query.trim().toLowerCase();

  return clients.filter((client) => {
    const matchesStatus = status === "All" || client.status === status;
    const matchesQuery =
      !value ||
      [client.name, client.company, client.email, client.phone, client.status]
        .join(" ")
        .toLowerCase()
        .includes(value);

    return matchesStatus && matchesQuery;
  });
}
