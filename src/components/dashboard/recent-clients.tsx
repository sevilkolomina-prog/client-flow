"use client";

import { Loader2 } from "lucide-react";

import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { getInitials, type Client } from "@/components/clients/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RecentClients({
  clients,
  loading = false,
}: {
  clients: Client[];
  loading?: boolean;
}) {
  return (
    <Card className="bg-card shadow-xs">
      <CardHeader>
        <CardTitle>Recent Clients</CardTitle>
        <CardDescription>People and companies you work with.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading clients...
          </div>
        ) : clients.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No clients yet. Add a client to see it here.
          </p>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{client.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {client.company}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {client.email}
                </p>
              </div>
              <ClientStatusBadge status={client.status} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
