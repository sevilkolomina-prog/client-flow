import type { Client } from "@/components/clients/data";
import type { Invoice } from "@/components/invoices/data";
import type { Project } from "@/components/projects/data";

export type DashboardKpis = {
  totalClients: number;
  activeProjects: number;
  outstandingInvoices: number;
  monthlyRevenue: number;
};

export type DashboardData = {
  kpis: DashboardKpis;
  recentProjects: Project[];
  recentClients: Client[];
  recentInvoices: Invoice[];
};

const RECENT_LIMIT = 5;

function currentYearMonth(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Temporary: invoices have no paid_at column.
 * Monthly revenue currently sums Paid invoices whose issue_date falls in the
 * current calendar month. Replace this with paid_at when that field exists.
 */
export function getCurrentMonthPaidRevenue(
  invoices: Invoice[],
  now = new Date()
) {
  const prefix = currentYearMonth(now);

  return invoices.reduce((sum, invoice) => {
    if (invoice.status !== "Paid") {
      return sum;
    }

    if (!invoice.issueDate.startsWith(prefix)) {
      return sum;
    }

    return sum + invoice.amount;
  }, 0);
}

export function getOutstandingInvoiceTotal(invoices: Invoice[]) {
  return invoices.reduce((sum, invoice) => {
    if (invoice.status === "Sent" || invoice.status === "Overdue") {
      return sum + invoice.amount;
    }

    return sum;
  }, 0);
}

export function getDashboardData(
  clients: Client[],
  projects: Project[],
  invoices: Invoice[]
): DashboardData {
  return {
    kpis: {
      totalClients: clients.length,
      activeProjects: projects.filter(
        (project) => project.status === "In Progress"
      ).length,
      outstandingInvoices: getOutstandingInvoiceTotal(invoices),
      monthlyRevenue: getCurrentMonthPaidRevenue(invoices),
    },
    recentProjects: projects.slice(0, RECENT_LIMIT),
    recentClients: clients.slice(0, RECENT_LIMIT),
    recentInvoices: invoices.slice(0, RECENT_LIMIT),
  };
}
