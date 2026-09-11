import { getProjectClientLabel } from "@/components/projects/data";

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export type Invoice = {
  id: string;
  number: string;
  clientId: string;
  projectId: string;
  client: string;
  project: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes: string;
};

export type InvoiceFormValues = {
  clientId: string;
  projectId: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes: string;
};

export type InvoiceClientOption = {
  id: string;
  name: string;
  company: string;
};

export type InvoiceRow = {
  id: string;
  user_id: string;
  client_id: string;
  project_id: string;
  invoice_number: string;
  amount: number | string;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
  client:
    | {
        id: string;
        full_name: string;
        company: string;
      }
    | {
        id: string;
        full_name: string;
        company: string;
      }[]
    | null;
  project:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
};

export const invoiceStatuses: InvoiceStatus[] = [
  "Draft",
  "Sent",
  "Paid",
  "Overdue",
];

export const invoiceStatusFilters = ["All", ...invoiceStatuses] as const;

export type InvoiceStatusFilter = (typeof invoiceStatusFilters)[number];

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return invoiceStatuses.includes(value as InvoiceStatus);
}

function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function mapInvoiceRow(row: InvoiceRow): Invoice {
  const relatedClient = firstRelated(row.client);
  const relatedProject = firstRelated(row.project);
  const amount = Number(row.amount);

  return {
    id: row.id,
    number: row.invoice_number,
    clientId: row.client_id,
    projectId: row.project_id,
    client: relatedClient
      ? getProjectClientLabel(relatedClient)
      : "Unknown client",
    project: relatedProject?.name ?? "Unknown project",
    amount: Number.isFinite(amount) ? amount : 0,
    status: isInvoiceStatus(row.status) ? row.status : "Draft",
    issueDate: row.issue_date,
    dueDate: row.due_date,
    notes: row.notes ?? "",
  };
}

export function formatInvoiceAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatInvoiceDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${monthLabels[month - 1]} ${day}, ${year}`;
}

export function nextInvoiceNumber(invoices: { number: string }[]) {
  const highest = invoices.reduce((max, invoice) => {
    const parsed = Number(invoice.number.replace(/^INV-/, ""));
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 1000);

  return `INV-${highest + 1}`;
}

export function filterInvoices(
  invoices: Invoice[],
  query: string,
  status: InvoiceStatusFilter
) {
  const value = query.trim().toLowerCase();

  return invoices.filter((invoice) => {
    const matchesStatus = status === "All" || invoice.status === status;
    const matchesQuery =
      !value ||
      [
        invoice.number,
        invoice.client,
        invoice.project,
        invoice.status,
        invoice.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);

    return matchesStatus && matchesQuery;
  });
}

export function getInvoiceSummary(invoices: Invoice[]) {
  return invoices.reduce(
    (summary, invoice) => {
      summary.totalInvoiced += invoice.amount;

      if (invoice.status === "Paid") {
        summary.paid += invoice.amount;
      }

      if (invoice.status === "Sent" || invoice.status === "Overdue") {
        summary.outstanding += invoice.amount;
      }

      if (invoice.status === "Overdue") {
        summary.overdue += invoice.amount;
      }

      return summary;
    },
    {
      totalInvoiced: 0,
      paid: 0,
      outstanding: 0,
      overdue: 0,
    }
  );
}
