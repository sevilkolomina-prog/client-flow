"use client";

import { createClient } from "@/lib/supabase/client";
import {
  mapProjectRow,
  PROJECT_SELECT,
  toProjectPayload,
  type Project,
  type ProjectFormValues,
  type ProjectRow,
} from "@/components/projects/data";
import { toUserFacingError } from "@/lib/errors";

async function requireUserId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(
      toUserFacingError(error, "You must be logged in to manage projects.")
    );
  }

  if (!data.user) {
    throw new Error("You must be logged in to manage projects.");
  }

  return { supabase, userId: data.user.id };
}

export async function fetchProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(toUserFacingError(error, "Unable to load projects."));
  }

  return (data as ProjectRow[]).map(mapProjectRow);
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
    .select(PROJECT_SELECT)
    .single();

  if (error) {
    throw new Error(toUserFacingError(error, "Unable to update project."));
  }

  return mapProjectRow(data as ProjectRow);
}

export async function deleteProjectRecord(id: string) {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    throw new Error(toUserFacingError(error, "Unable to delete project."));
  }
}
