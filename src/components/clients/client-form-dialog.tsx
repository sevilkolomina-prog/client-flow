"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import {
  clientStatuses,
  type Client,
  type ClientFormValues,
  type ClientStatus,
} from "@/components/clients/data";
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

type ClientFormDialogProps = {
  open: boolean;
  client?: Client | null;
  pending?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ClientFormValues) => Promise<void>;
};

const emptyForm: ClientFormValues = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "Active",
};

function formFromClient(client?: Client | null): ClientFormValues {
  if (!client) {
    return emptyForm;
  }

  return {
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    status: client.status,
  };
}

export function ClientFormDialog({
  open,
  client,
  pending = false,
  error,
  onOpenChange,
  onSubmit,
}: ClientFormDialogProps) {
  const isEditing = Boolean(client);
  const [form, setForm] = useState<ClientFormValues>(formFromClient(client));

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setForm(formFromClient(client));
    } else {
      setForm(emptyForm);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    await onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(90dvh,40rem)] overflow-y-auto sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add Client"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this client's information."
              : "Add a new client to your workspace."}
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
          <div className="grid gap-2">
            <Label htmlFor="client-name">Full Name</Label>
            <Input
              id="client-name"
              name="name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-company">Company</Label>
            <Input
              id="client-company"
              name="company"
              value={form.company}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  company: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-phone">Phone</Label>
            <Input
              id="client-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => {
                if (value) {
                  setForm((current) => ({
                    ...current,
                    status: value as ClientStatus,
                  }));
                }
              }}
            >
              <SelectTrigger id="client-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clientStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : null}
              {isEditing ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
