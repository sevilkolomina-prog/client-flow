"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";

import { createClientRecord } from "@/components/clients/actions";
import {
  deleteClientRecord,
  fetchClients,
  updateClientRecord,
} from "@/components/clients/api";
import { fetchProjects } from "@/components/projects/api";
import { ClientActionsMenu } from "@/components/clients/client-actions-menu";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import {
  clientStatusFilters,
  filterClients,
  getInitials,
  type Client,
  type ClientFormValues,
  type ClientStatusFilter,
} from "@/components/clients/data";
import { fetchOrCreateProfile } from "@/components/settings/api";
import {
  FREE_CLIENT_LIMIT,
  hasReachedFreePlanLimit,
} from "@/lib/billing/limits";
import { parsePlan, type PlanId } from "@/lib/billing/plans";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

function countProjectsByClient(projects: { clientId: string }[]) {
  const counts: Record<string, number> = {};

  for (const project of projects) {
    counts[project.clientId] = (counts[project.clientId] ?? 0) + 1;
  }

  return counts;
}

export function ClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>(
    {}
  );
  const [plan, setPlan] = useState<PlanId>("free");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ClientStatusFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visibleClients = useMemo(
    () => filterClients(clients, query, status),
    [clients, query, status]
  );
  const clientLimitReached = hasReachedFreePlanLimit(
    plan,
    clients.length,
    FREE_CLIENT_LIMIT
  );

  async function loadClients() {
    setLoading(true);
    setError(null);

    try {
      const [nextClients, nextProjects, profile] = await Promise.all([
        fetchClients(),
        fetchProjects(),
        fetchOrCreateProfile(),
      ]);
      setClients(nextClients);
      setProjectCounts(countProjectsByClient(nextProjects));
      setPlan(parsePlan(profile.plan));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load clients."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchClients(), fetchProjects(), fetchOrCreateProfile()])
      .then(([nextClients, nextProjects, profile]) => {
        if (!cancelled) {
          setClients(nextClients);
          setProjectCounts(countProjectsByClient(nextProjects));
          setPlan(parsePlan(profile.plan));
          setError(null);
          setLoading(false);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Unable to load clients."
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openAddDialog() {
    if (clientLimitReached) {
      return;
    }

    setEditingClient(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(client: Client) {
    setEditingClient(client);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setEditingClient(null);
      setFormError(null);
    }
    setDialogOpen(open);
  }

  async function handleSubmit(values: ClientFormValues) {
    setFormPending(true);
    setFormError(null);

    try {
      if (editingClient) {
        const updated = await updateClientRecord(editingClient.id, values);
        setClients((current) =>
          current.map((client) =>
            client.id === updated.id ? updated : client
          )
        );
      } else {
        const created = await createClientRecord(values);
        setClients((current) => [created, ...current]);
      }

      handleDialogOpenChange(false);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Unable to save client."
      );
    } finally {
      setFormPending(false);
    }
  }

  async function handleDelete(client: Client) {
    setDeletingId(client.id);
    setError(null);

    try {
      await deleteClientRecord(client.id);
      setClients((current) =>
        current.filter((item) => item.id !== client.id)
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to delete client."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const emptyMessage =
    clients.length === 0
      ? "No clients yet. Add your first client to get started."
      : "No clients match your search.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Manage your clients and their information
          </p>
        </div>
        {clientLimitReached ? (
          <Button
            className="w-full sm:w-auto"
            nativeButton={false}
            render={<Link href="/pricing" />}
          >
            Free plan limit reached — Upgrade
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" onClick={openAddDialog}>
            <Plus data-icon="inline-start" />
            Add Client
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clients..."
            aria-label="Search clients"
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            if (value) {
              setStatus(value as ClientStatusFilter);
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
            {clientStatusFilters.map((filter) => (
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
          <Button type="button" variant="outline" size="sm" onClick={() => void loadClients()}>
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <Card className="bg-card shadow-xs">
          <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading clients...
          </CardContent>
        </Card>
      ) : visibleClients.length === 0 ? (
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
                    <TableHead className="px-4">Client</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarFallback>
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{client.company}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.phone}
                      </TableCell>
                      <TableCell>{projectCounts[client.id] ?? 0}</TableCell>
                      <TableCell>
                        <ClientStatusBadge status={client.status} />
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <ClientActionsMenu
                          clientName={client.name}
                          disableDelete={deletingId === client.id}
                          onEdit={() => openEditDialog(client)}
                          onDelete={() => void handleDelete(client)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:hidden">
            {visibleClients.map((client) => (
              <Card key={client.id} className="bg-card shadow-xs">
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{client.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {client.company}
                        </p>
                      </div>
                    </div>
                    <ClientActionsMenu
                      clientName={client.name}
                      disableDelete={deletingId === client.id}
                      onEdit={() => openEditDialog(client)}
                      onDelete={() => void handleDelete(client)}
                    />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="truncate">{client.email}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd>{client.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Projects</dt>
                      <dd>{projectCounts[client.id] ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="pt-1">
                        <ClientStatusBadge status={client.status} />
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <ClientFormDialog
        key={editingClient?.id ?? "new-client"}
        open={dialogOpen}
        client={editingClient}
        pending={formPending}
        error={formError}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
