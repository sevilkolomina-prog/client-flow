"use client";

import { createClient } from "@/lib/supabase/client";
import {
  mapProjectRow,
  type Project,
  type ProjectFormValues,
  type ProjectRow,
} from "@/components/projects/data";

const projectSelect = `
  id,
  user_id,
  client_id,
  name,
  description,
  status,
  value,
  progress,
  start_date,
  due_date,
  created_at,
  updated_at,
  client:clients (
    id,
    full_name,
    company
  )
`;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

async function requireUserId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("You must be logged in to manage projects.");
  }

  return { supabase, userId: data.user.id };
}

function toProjectPayload(userId: string, values: ProjectFormValues) {
  const value = Number(values.value);
  const progress = Number(values.progress);

  return {
    user_id: userId,
    client_id: values.clientId,
    name: values.name.trim(),
    description: values.description.trim(),
    status: values.status,
    value: Number.isFinite(value) ? value : 0,
    progress: Math.min(
      100,
      Math.max(0, Number.isFinite(progress) ? Math.round(progress) : 0)
    ),
    start_date: values.startDate,
    due_date: values.dueDate,
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(projectSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProjectRow[]).map(mapProjectRow);
}

export async function createProjectRecord(
  values: ProjectFormValues
): Promise<Project> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("projects")
    .insert(toProjectPayload(userId, values))
    .select(projectSelect)
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to add project."));
  }

  return mapProjectRow(data as ProjectRow);
}

export async function updateProjectRecord(
  id: string,
  values: ProjectFormValues
): Promise<Project> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("projects")
    .update(toProjectPayload(userId, values))
    .eq("id", id)
    .select(projectSelect)
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to update project."));
  }

  return mapProjectRow(data as ProjectRow);
}

export async function deleteProjectRecord(id: string) {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to delete project."));
  }
}
