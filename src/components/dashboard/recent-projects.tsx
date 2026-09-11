"use client";

import { Loader2 } from "lucide-react";

import type { Project } from "@/components/projects/data";
import {
  formatProjectDate,
  formatProjectValue,
} from "@/components/projects/data";
import { ProjectProgress } from "@/components/projects/project-progress";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RecentProjects({
  projects,
  loading = false,
}: {
  projects: Project[];
  loading?: boolean;
}) {
  return (
    <Card className="bg-card shadow-xs">
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
        <CardDescription>Latest work across your clients.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No projects yet. Create a project to see it here.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="min-w-36">Progress</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.client}
                      </TableCell>
                      <TableCell>
                        <ProjectStatusBadge status={project.status} />
                      </TableCell>
                      <TableCell>{formatProjectValue(project.value)}</TableCell>
                      <TableCell>
                        <ProjectProgress value={project.progress} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatProjectDate(project.dueDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 md:hidden">
              {projects.map((project) => (
                <div key={project.id} className="space-y-3 border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{project.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {project.client}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="pt-1">
                        <ProjectStatusBadge status={project.status} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Value</dt>
                      <dd>{formatProjectValue(project.value)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Progress</dt>
                      <dd className="pt-1">
                        <ProjectProgress value={project.progress} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Due</dt>
                      <dd>{formatProjectDate(project.dueDate)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
