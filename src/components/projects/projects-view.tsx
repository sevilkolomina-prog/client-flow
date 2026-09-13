"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";

import { fetchClients } from "@/components/clients/api";
import { createProjectRecord } from "@/components/projects/actions";
import {
  deleteProjectRecord,
  fetchProjects,
  updateProjectRecord,
} from "@/components/projects/api";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectProgress } from "@/components/projects/project-progress";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { ProjectSummaryCards } from "@/components/projects/project-summary-cards";
import {
  filterProjects,
  formatProjectDate,
  formatProjectValue,
  projectStatusFilters,
  type Project,
  type ProjectClientOption,
  type ProjectFormValues,
  type ProjectStatusFilter,
} from "@/components/projects/data";
import { fetchOrCreateProfile } from "@/components/settings/api";
import {
  FREE_PROJECT_LIMIT,
  hasReachedFreePlanLimit,
} from "@/lib/billing/limits";
import { parsePlan, type PlanId } from "@/lib/billing/plans";
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

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ProjectClientOption[]>([]);
  const [plan, setPlan] = useState<PlanId>("free");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProjectStatusFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visibleProjects = useMemo(
    () => filterProjects(projects, query, status),
    [projects, query, status]
  );
  const projectLimitReached = hasReachedFreePlanLimit(
    plan,
    projects.length,
    FREE_PROJECT_LIMIT
  );

  async function loadProjects() {
    setLoading(true);
    setError(null);

    try {
      const [nextProjects, nextClients, profile] = await Promise.all([
        fetchProjects(),
        fetchClients(),
        fetchOrCreateProfile(),
      ]);
      setProjects(nextProjects);
      setClients(nextClients);
      setPlan(parsePlan(profile.plan));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load projects."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchProjects(), fetchClients(), fetchOrCreateProfile()])
      .then(([nextProjects, nextClients, profile]) => {
        if (!cancelled) {
          setProjects(nextProjects);
          setClients(nextClients);
          setPlan(parsePlan(profile.plan));
          setError(null);
          setLoading(false);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load projects."
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openAddDialog() {
    if (projectLimitReached) {
      return;
    }

    setEditingProject(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(project: Project) {
    setEditingProject(project);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setEditingProject(null);
      setFormError(null);
    }
    setDialogOpen(open);
  }

  async function handleSubmit(values: ProjectFormValues) {
    setFormPending(true);
    setFormError(null);

    try {
      if (editingProject) {
        const updated = await updateProjectRecord(editingProject.id, values);
        setProjects((current) =>
          current.map((project) =>
            project.id === updated.id ? updated : project
          )
        );
      } else {
        const created = await createProjectRecord(values);
        setProjects((current) => [created, ...current]);
      }

      handleDialogOpenChange(false);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Unable to save project."
      );
    } finally {
      setFormPending(false);
    }
  }

  async function handleDelete(project: Project) {
    setDeletingId(project.id);
    setError(null);

    try {
      await deleteProjectRecord(project.id);
      setProjects((current) =>
        current.filter((item) => item.id !== project.id)
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to delete project."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const emptyMessage =
    projects.length === 0
      ? clients.length === 0
        ? "No projects yet. Add a client first, then create a project."
        : "No projects yet. Create your first project to get started."
      : "No projects match your search.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage and track your client projects
          </p>
        </div>
        {projectLimitReached ? (
          <Button
            className="w-full sm:w-auto"
            nativeButton={false}
            render={<Link href="/pricing" />}
          >
            Free plan limit reached — Upgrade
          </Button>
        ) : (
          <Button
            className="w-full sm:w-auto"
            onClick={openAddDialog}
            disabled={clients.length === 0}
          >
            <Plus data-icon="inline-start" />
            New Project
          </Button>
        )}
      </div>

      <ProjectSummaryCards projects={projects} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            if (value) {
              setStatus(value as ProjectStatusFilter);
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
            {projectStatusFilters.map((filter) => (
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadProjects()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <Card className="bg-card shadow-xs">
          <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading projects...
          </CardContent>
        </Card>
      ) : visibleProjects.length === 0 ? (
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
                    <TableHead className="px-4">Project Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="min-w-44">Progress</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="px-4 font-medium">
                        {project.name}
                      </TableCell>
                      <TableCell>{project.client}</TableCell>
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
                      <TableCell className="px-4 text-right">
                        <ProjectActionsMenu
                          projectName={project.name}
                          disableDelete={deletingId === project.id}
                          onEdit={() => openEditDialog(project)}
                          onDelete={() => void handleDelete(project)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:hidden">
            {visibleProjects.map((project) => (
              <Card key={project.id} className="bg-card shadow-xs">
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{project.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {project.client}
                      </p>
                    </div>
                    <ProjectActionsMenu
                      projectName={project.name}
                      disableDelete={deletingId === project.id}
                      onEdit={() => openEditDialog(project)}
                      onDelete={() => void handleDelete(project)}
                    />
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
                      <dt className="text-muted-foreground">Due Date</dt>
                      <dd>{formatProjectDate(project.dueDate)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <ProjectFormDialog
        key={editingProject?.id ?? "new-project"}
        open={dialogOpen}
        project={editingProject}
        clients={clients}
        pending={formPending}
        error={formError}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
