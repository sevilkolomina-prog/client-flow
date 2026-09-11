"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import {
  getProjectClientLabel,
  projectStatuses,
  type Project,
  type ProjectClientOption,
  type ProjectFormValues,
  type ProjectStatus,
} from "@/components/projects/data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ProjectFormDialogProps = {
  open: boolean;
  project?: Project | null;
  clients: ProjectClientOption[];
  pending?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
};

type FormState = {
  name: string;
  clientId: string;
  description: string;
  status: ProjectStatus;
  value: string;
  startDate: string;
  dueDate: string;
  progress: string;
};

const emptyForm: FormState = {
  name: "",
  clientId: "",
  description: "",
  status: "Planning",
  value: "",
  startDate: "",
  dueDate: "",
  progress: "0",
};

function formFromProject(project?: Project | null): FormState {
  if (!project) {
    return emptyForm;
  }

  return {
    name: project.name,
    clientId: project.clientId,
    description: project.description,
    status: project.status,
    value: String(project.value),
    startDate: project.startDate,
    dueDate: project.dueDate,
    progress: String(project.progress),
  };
}

export function ProjectFormDialog({
  open,
  project,
  clients,
  pending = false,
  error,
  onOpenChange,
  onSubmit,
}: ProjectFormDialogProps) {
  const isEditing = Boolean(project);
  const [form, setForm] = useState<FormState>(formFromProject(project));

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setForm(formFromProject(project));
    } else {
      setForm(emptyForm);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending || !form.clientId) {
      return;
    }

    const value = Number(form.value);
    const progress = Number(form.progress);

    await onSubmit({
      name: form.name.trim(),
      clientId: form.clientId,
      description: form.description.trim(),
      status: form.status,
      value: Number.isFinite(value) ? value : 0,
      startDate: form.startDate,
      dueDate: form.dueDate,
      progress: Math.min(
        100,
        Math.max(0, Number.isFinite(progress) ? progress : 0)
      ),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "New Project"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this project's details."
              : "Create a project and add it to your workspace."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              name="name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-client">Client</Label>
            <Select
              name="client"
              required
              value={form.clientId || null}
              onValueChange={(value) => {
                if (value) {
                  setForm((current) => ({ ...current, clientId: value }));
                }
              }}
            >
              <SelectTrigger id="project-client" className="w-full">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {getProjectClientLabel(client)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add a client first to create a project.
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              name="description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="project-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  if (value) {
                    setForm((current) => ({
                      ...current,
                      status: value as ProjectStatus,
                    }));
                  }
                }}
              >
                <SelectTrigger id="project-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-value">Project Value</Label>
              <Input
                id="project-value"
                name="value"
                type="number"
                min={0}
                step="1"
                value={form.value}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    value: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-start-date">Start Date</Label>
              <Input
                id="project-start-date"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-due-date">Due Date</Label>
              <Input
                id="project-due-date"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-progress">Progress</Label>
            <Input
              id="project-progress"
              name="progress"
              type="number"
              min={0}
              max={100}
              step="1"
              value={form.progress}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  progress: event.target.value,
                }))
              }
              required
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending || clients.length === 0}>
              {pending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : null}
              {isEditing ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
