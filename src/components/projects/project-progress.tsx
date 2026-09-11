"use client";

import { Progress } from "@/components/ui/progress";

export function ProjectProgress({ value }: { value: number }) {
  return (
    <div className="flex min-w-36 items-center gap-2">
      <Progress value={value} className="min-w-0 flex-1 gap-0" />
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {value}%
      </span>
    </div>
  );
}
