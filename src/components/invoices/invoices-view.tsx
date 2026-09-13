"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";

import { fetchClients } from "@/components/clients/api";
import {
  createInvoiceRecord,
  deleteInvoiceRecord,
  fetchInvoices,
  markInvoicePaid,
  updateInvoiceRecord,
} from "@/components/invoices/api";
import { InvoiceActionsMenu } from "@/components/invoices/invoice-actions-menu";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { InvoiceSummaryCards } from "@/components/invoices/invoice-summary-cards";
import {
  filterInvoices,
  formatInvoiceAmount,
  formatInvoiceDate,
  invoiceStatusFilters,
  type Invoice,
  type InvoiceClientOption,
  type InvoiceFormValues,
  type InvoiceStatusFilter,
} from "@/components/invoices/data";
import { fetchProjects } from "@/components/projects/api";
import type { Project } from "@/components/projects/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function InvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<InvoiceClientOption[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<InvoiceStatusFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const visibleInvoices = useMemo(
    () => filterInvoices(invoices, query, status),
    [invoices, query, status]
  );

  async function loadInvoices() {
    setLoading(true);
    setError(null);

    try {
      const [nextInvoices, nextClients, nextProjects] = await Promise.all([
        fetchInvoices(),
        fetchClients(),
        fetchProjects(),
      ]);
      setInvoices(nextInvoices);
      setClients(nextClients);
      setProjects(nextProjects);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load invoices."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchInvoices(), fetchClients(), fetchProjects()])
      .then(([nextInvoices, nextClients, nextProjects]) => {
        if (!cancelled) {
          setInvoices(nextInvoices);
          setClients(nextClients);
          setProjects(nextProjects);
          setError(null);
          setLoading(false);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load invoices."
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openAddDialog() {
    setEditingInvoice(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(invoice: Invoice) {
    setEditingInvoice(invoice);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setEditingInvoice(null);
      setFormError(null);
    }
    setDialogOpen(open);
  }

  async function handleSubmit(values: InvoiceFormValues) {
    setFormPending(true);
    setFormError(null);

    try {
      if (editingInvoice) {
        const updated = await updateInvoiceRecord(
          editingInvoice.id,
          values,
          editingInvoice.number
        );
        setInvoices((current) =>
          current.map((invoice) =>
            invoice.id === updated.id ? updated : invoice
          )
        );
      } else {
        const created = await createInvoiceRecord(values);
        setInvoices((current) => [created, ...current]);
      }

      handleDialogOpenChange(false);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Unable to save invoice."
      );
    } finally {
      setFormPending(false);
    }
  }

  async function handleMarkAsPaid(invoice: Invoice) {
    setPayingId(invoice.id);
    setError(null);

    try {
      const updated = await markInvoicePaid(invoice.id);
      setInvoices((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to mark invoice as paid."
      );
    } finally {
      setPayingId(null);
    }
  }

  async function handleDelete(invoice: Invoice) {
    setDeletingId(invoice.id);
    setError(null);

    try {
      await deleteInvoiceRecord(invoice.id);
      setInvoices((current) =>
        current.filter((item) => item.id !== invoice.id)
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to delete invoice."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const emptyMessage =
    invoices.length === 0
      ? clients.length === 0
        ? "No invoices yet. Add a client and project first."
        : "No invoices yet. Create your first invoice to get started."
      : "No invoices match your search.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            Create and track client invoices
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={openAddDialog}
          disabled={clients.length === 0}
        >
          <Plus data-icon="inline-start" />
          New Invoice
        </Button>
      </div>

      <InvoiceSummaryCards invoices={invoices} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search invoices..."
            aria-label="Search invoices"
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            if (value) {
              setStatus(value as InvoiceStatusFilter);
            }
          }}
        >
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label="Filter by status"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {invoiceStatusFilters.map((filter) => (
              <SelectItem key={filter} value={filter}>
                {filter}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <p role="alert">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadInvoices()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <Card className="bg-card shadow-xs">
          <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading invoices...
          </CardContent>
        </Card>
      ) : visibleInvoices.length === 0 ? (
        <Card className="bg-card shadow-xs">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden bg-card shadow-xs md:block">
            <CardContent className="overflow-x-auto px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4">Invoice Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="px-4 font-medium">
                        {invoice.number}
                      </TableCell>
                      <TableCell>{invoice.client}</TableCell>
                      <TableCell>{invoice.project}</TableCell>
                      <TableCell>
                        {formatInvoiceAmount(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatInvoiceDate(invoice.issueDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatInvoiceDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <InvoiceActionsMenu
                          invoiceNumber={invoice.number}
                          status={invoice.status}
                          disableDelete={deletingId === invoice.id}
                          disableMarkAsPaid={payingId === invoice.id}
                          onEdit={() => openEditDialog(invoice)}
                          onMarkAsPaid={() => void handleMarkAsPaid(invoice)}
                          onDelete={() => void handleDelete(invoice)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:hidden">
            {visibleInvoices.map((invoice) => (
              <Card key={invoice.id} className="bg-card shadow-xs">
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{invoice.number}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {invoice.client}
                      </p>
                    </div>
                    <InvoiceActionsMenu
                      invoiceNumber={invoice.number}
                      status={invoice.status}
                      disableDelete={deletingId === invoice.id}
                      disableMarkAsPaid={payingId === invoice.id}
                      onEdit={() => openEditDialog(invoice)}
                      onMarkAsPaid={() => void handleMarkAsPaid(invoice)}
                      onDelete={() => void handleDelete(invoice)}
                    />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Project</dt>
                      <dd className="truncate">{invoice.project}</dd>
                    </div>
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
                      <dt className="text-muted-foreground">Issue Date</dt>
                      <dd>{formatInvoiceDate(invoice.issueDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Due Date</dt>
                      <dd>{formatInvoiceDate(invoice.dueDate)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <InvoiceFormDialog
        key={editingInvoice?.id ?? "new-invoice"}
        open={dialogOpen}
        invoice={editingInvoice}
        clients={clients}
        projects={projects}
        pending={formPending}
        error={formError}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
