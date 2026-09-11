"use client";

import { DollarSign, FileText, FolderKanban, Loader2, Users } from "lucide-react";

import type { DashboardKpis } from "@/components/dashboard/data";
import { formatInvoiceAmount } from "@/components/invoices/data";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const kpiMeta = [
  {
    key: "totalClients",
    title: "Total Clients",
    icon: Users,
    format: "count",
  },
  {
    key: "activeProjects",
    title: "Active Projects",
    icon: FolderKanban,
    format: "count",
  },
  {
    key: "outstandingInvoices",
    title: "Outstanding Invoices",
    icon: FileText,
    format: "money",
  },
  {
    key: "monthlyRevenue",
    title: "Monthly Revenue",
    icon: DollarSign,
    format: "money",
  },
] as const;

const emptyKpis: DashboardKpis = {
  totalClients: 0,
  activeProjects: 0,
  outstandingInvoices: 0,
  monthlyRevenue: 0,
};

export function KpiCards({
  kpis = emptyKpis,
  loading = false,
}: {
  kpis?: DashboardKpis;
  loading?: boolean;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiMeta.map((item) => {
        const Icon = item.icon;
        const rawValue = kpis[item.key];
        const value =
          item.format === "money"
            ? formatInvoiceAmount(rawValue)
            : String(rawValue);

        return (
          <Card key={item.title} className="min-w-0 bg-card shadow-xs">
            <CardHeader>
              <CardDescription>{item.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {loading ? (
                  <Loader2
                    className="size-5 animate-spin text-muted-foreground"
                    aria-label={`Loading ${item.title}`}
                  />
                ) : (
                  value
                )}
              </CardTitle>
              <CardAction>
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </div>
              </CardAction>
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}
