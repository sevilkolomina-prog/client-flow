"use server";

import {
  isProjectStatus,
  mapProjectRow,
  PROJECT_SELECT,
  toProjectPayload,
  type Project,
  type ProjectFormValues,
  type ProjectRow,
} from "@/components/projects/data";
import {
  asLimitOrFallback,
  assertCanCreateProject,
} from "@/lib/billing/enforce";
import { FREE_PROJECT_LIMIT_MESSAGE } from "@/lib/billing/limits";

export async function createProjectRecord(
  values: ProjectFormValues
): Promise<Project> {
  const name = values.name.trim();
  const clientId = values.clientId.trim();
  const description = values.description.trim();
  const startDate = values.startDate.trim();
  const dueDate = values.dueDate.trim();

  if (!name || !clientId || !description || !startDate || !dueDate) {
    throw new Error("All project fields are required.");
  }

  if (!isProjectStatus(values.status)) {
    throw new Error("Select a valid project status.");
  }

  const { supabase, userId } = await assertCanCreateProject();
  const { data, error } = await supabase
    .from("projects")
    .insert(toProjectPayload(userId, { ...values, name, clientId, description }))
    .select(PROJECT_SELECT)
    .single();

  if (error) {
    throw new Error(
      asLimitOrFallback(
        error,
        FREE_PROJECT_LIMIT_MESSAGE,
        "Unable to add project."
      )
    );
  }

  return mapProjectRow(data as ProjectRow);
}
