"use client";

import { AlertCircle, CircleCheck, Clock, DollarSign } from "lucide-react";

import {
  formatInvoiceAmount,
  getInvoiceSummary,
  type Invoice,
} from "@/components/invoices/data";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const summaryMeta = [
  { key: "totalInvoiced", title: "Total Invoiced", icon: DollarSign },
  { key: "paid", title: "Paid", icon: CircleCheck },
  { key: "outstanding", title: "Outstanding", icon: Clock },
  { key: "overdue", title: "Overdue", icon: AlertCircle },
] as const;

export function InvoiceSummaryCards({ invoices }: { invoices: Invoice[] }) {
  const summary = getInvoiceSummary(invoices);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryMeta.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title} className="min-w-0 bg-card shadow-xs">
            <CardHeader>
              <CardDescription>{item.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {formatInvoiceAmount(summary[item.key])}
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
