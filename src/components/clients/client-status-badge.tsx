import { Badge } from "@/components/ui/badge";
import type { ClientStatus } from "@/components/clients/data";

function statusVariant(status: ClientStatus) {
  if (status === "Active") return "default" as const;
  if (status === "Lead") return "secondary" as const;
  return "outline" as const;
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <Badge variant={statusVariant(status)}>{status}</Badge>;
}
