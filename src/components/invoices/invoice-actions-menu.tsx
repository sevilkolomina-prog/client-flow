"use client";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InvoiceStatus } from "@/components/invoices/data";

type InvoiceActionsMenuProps = {
  invoiceNumber: string;
  status: InvoiceStatus;
  disableDelete?: boolean;
  disableMarkAsPaid?: boolean;
  onEdit: () => void;
  onMarkAsPaid: () => void;
  onDelete: () => void;
};

export function InvoiceActionsMenu({
  invoiceNumber,
  status,
  disableDelete = false,
  disableMarkAsPaid = false,
  onEdit,
  onMarkAsPaid,
  onDelete,
}: InvoiceActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${invoiceNumber}`}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem
          disabled={status === "Paid" || disableMarkAsPaid}
          onClick={onMarkAsPaid}
        >
          Mark as Paid
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={disableDelete}
          onClick={onDelete}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
