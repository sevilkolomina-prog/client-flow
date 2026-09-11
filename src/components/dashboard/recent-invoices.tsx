"use client";

import { Loader2 } from "lucide-react";

import {
  formatInvoiceAmount,
  formatInvoiceDate,
  type Invoice,
} from "@/components/invoices/data";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RecentInvoices({
  invoices,
  loading = false,
}: {
  invoices: Invoice[];
  loading?: boolean;
}) {
  return (
    <Card className="bg-card shadow-xs">
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
        <CardDescription>Latest invoices across your clients.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No invoices yet. Create an invoice to see it here.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.number}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.client}
                      </TableCell>
                      <TableCell>{formatInvoiceAmount(invoice.amount)}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatInvoiceDate(invoice.dueDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 md:hidden">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="space-y-3 border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {invoice.number}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {invoice.client}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Amount</dt>
                      <dd>{formatInvoiceAmount(invoice.amount)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="pt-1">
                        <InvoiceStatusBadge status={invoice.status} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Due</dt>
                      <dd>{formatInvoiceDate(invoice.dueDate)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
