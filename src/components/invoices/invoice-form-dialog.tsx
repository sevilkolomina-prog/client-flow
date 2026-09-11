"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import {
  getProjectClientLabel,
  type Project,
} from "@/components/projects/data";
import {
  invoiceStatuses,
  type Invoice,
  type InvoiceClientOption,
  type InvoiceFormValues,
  type InvoiceStatus,
} from "@/components/invoices/data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type InvoiceFormDialogProps = {
  open: boolean;
  invoice?: Invoice | null;
  clients: InvoiceClientOption[];
  projects: Project[];
  pending?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
};

type FormState = {
  clientId: string;
  projectId: string;
  amount: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  notes: string;
};

const emptyForm: FormState = {
  clientId: "",
  projectId: "",
  amount: "",
  issueDate: "",
  dueDate: "",
  status: "Draft",
  notes: "",
};

function formFromInvoice(invoice?: Invoice | null): FormState {
  if (!invoice) {
    return emptyForm;
  }

  return {
    clientId: invoice.clientId,
    projectId: invoice.projectId,
    amount: String(invoice.amount),
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    notes: invoice.notes,
  };
}

export function InvoiceFormDialog({
  open,
  invoice,
  clients,
  projects,
  pending = false,
  error,
  onOpenChange,
  onSubmit,
}: InvoiceFormDialogProps) {
  const isEditing = Boolean(invoice);
  const [form, setForm] = useState<FormState>(formFromInvoice(invoice));

  const visibleProjects = useMemo(
    () =>
      form.clientId
        ? projects.filter((project) => project.clientId === form.clientId)
        : [],
    [form.clientId, projects]
  );

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setForm(formFromInvoice(invoice));
    } else {
      setForm(emptyForm);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending || !form.clientId || !form.projectId) {
      return;
    }

    const amount = Number(form.amount);

    await onSubmit({
      clientId: form.clientId,
      projectId: form.projectId,
      amount: Number.isFinite(amount) ? amount : 0,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: form.status,
      notes: form.notes.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Invoice" : "New Invoice"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this invoice's details."
              : "Create an invoice and add it to your workspace."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="invoice-client">Client</Label>
              <Select
                name="client"
                required
                value={form.clientId || null}
                onValueChange={(value) => {
                  if (value) {
                    setForm((current) => ({
                      ...current,
                      clientId: value,
                      projectId: projects.some(
                        (project) =>
                          project.id === current.projectId &&
                          project.clientId === value
                      )
                        ? current.projectId
                        : "",
                    }));
                  }
                }}
              >
                <SelectTrigger id="invoice-client" className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {getProjectClientLabel(client)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add a client first to create an invoice.
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-project">Project</Label>
              <Select
                name="project"
                required
                disabled={!form.clientId}
                value={form.projectId || null}
                onValueChange={(value) => {
                  if (value) {
                    setForm((current) => ({
                      ...current,
                      projectId: value,
                    }));
                  }
                }}
              >
                <SelectTrigger id="invoice-project" className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {visibleProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.clientId && visibleProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This client has no projects yet.
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-amount">Amount</Label>
              <Input
                id="invoice-amount"
                name="amount"
                type="number"
                min={0}
                step="1"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  if (value) {
                    setForm((current) => ({
                      ...current,
                      status: value as InvoiceStatus,
                    }));
                  }
                }}
              >
                <SelectTrigger id="invoice-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {invoiceStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-issue-date">Issue Date</Label>
              <Input
                id="invoice-issue-date"
                name="issueDate"
                type="date"
                value={form.issueDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    issueDate: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-due-date">Due Date</Label>
              <Input
                id="invoice-due-date"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invoice-notes">Notes</Label>
            <Textarea
              id="invoice-notes"
              name="notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={
                pending ||
                clients.length === 0 ||
                !form.clientId ||
                !form.projectId
              }
            >
              {pending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : null}
              {isEditing ? "Save Changes" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
