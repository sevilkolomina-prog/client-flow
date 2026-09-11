import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/components/invoices/data";

function statusVariant(status: InvoiceStatus) {
  if (status === "Paid") return "secondary" as const;
  if (status === "Sent") return "default" as const;
  if (status === "Overdue") return "destructive" as const;
  return "outline" as const;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={statusVariant(status)}>{status}</Badge>;
}
