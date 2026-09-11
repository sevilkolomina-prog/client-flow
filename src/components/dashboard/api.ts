"use client";

import { fetchClients } from "@/components/clients/api";
import { getDashboardData, type DashboardData } from "@/components/dashboard/data";
import { fetchInvoices } from "@/components/invoices/api";
import { fetchProjects } from "@/components/projects/api";

export async function fetchDashboardData(): Promise<DashboardData> {
  const [clients, projects, invoices] = await Promise.all([
    fetchClients(),
    fetchProjects(),
    fetchInvoices(),
  ]);

  return getDashboardData(clients, projects, invoices);
}
