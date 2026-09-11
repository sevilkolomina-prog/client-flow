import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/components/projects/data";

function statusVariant(status: ProjectStatus) {
  if (status === "In Progress") return "default" as const;
  if (status === "Completed") return "secondary" as const;
  if (status === "On Hold") return "outline" as const;
  return "outline" as const;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={statusVariant(status)}>{status}</Badge>;
}
