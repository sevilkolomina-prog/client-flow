"use client";

import { CircleCheck, DollarSign, FolderKanban, Loader } from "lucide-react";

import {
  formatProjectValue,
  getProjectSummary,
  type Project,
} from "@/components/projects/data";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const summaryMeta = [
  { key: "total", title: "Total Projects", icon: FolderKanban },
  { key: "inProgress", title: "In Progress", icon: Loader },
  { key: "completed", title: "Completed", icon: CircleCheck },
  { key: "value", title: "Total Project Value", icon: DollarSign },
] as const;

export function ProjectSummaryCards({ projects }: { projects: Project[] }) {
  const summary = getProjectSummary(projects);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryMeta.map((item) => {
        const Icon = item.icon;
        const value =
          item.key === "value"
            ? formatProjectValue(summary.value)
            : String(summary[item.key]);

        return (
          <Card key={item.title} className="min-w-0 bg-card shadow-xs">
            <CardHeader>
              <CardDescription>{item.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {value}
              </CardTitle>
              <CardAction>
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </div>
              </CardAction>
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}
