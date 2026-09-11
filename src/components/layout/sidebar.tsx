"use client";

import Link from "next/link";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function SidebarBrand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-3 px-3 py-1"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
        C
      </span>
      <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
        ClientFlow
      </span>
    </Link>
  );
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className="flex h-16 items-center px-3">
        <SidebarBrand />
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav onNavigate={onNavigate} />
      </div>
    </aside>
  );
}
