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

export type CreateProjectResult = {
  project?: Project;
  error?: string;
};

export async function createProjectRecord(
  values: ProjectFormValues
): Promise<CreateProjectResult> {
  try {
    const name = values.name.trim();
    const clientId = values.clientId.trim();
    const description = values.description.trim();
    const startDate = values.startDate.trim();
    const dueDate = values.dueDate.trim();

    if (!name || !clientId || !description || !startDate || !dueDate) {
      return { error: "All project fields are required." };
    }

    if (!isProjectStatus(values.status)) {
      return { error: "Select a valid project status." };
    }

    const { supabase, userId } = await assertCanCreateProject();
    const { data, error } = await supabase
      .from("projects")
      .insert(
        toProjectPayload(userId, { ...values, name, clientId, description })
      )
      .select(PROJECT_SELECT)
      .single();

    if (error) {
      return {
        error: asLimitOrFallback(
          error,
          FREE_PROJECT_LIMIT_MESSAGE,
          "Unable to add project."
        ),
      };
    }

    return { project: mapProjectRow(data as ProjectRow) };
  } catch (caught: unknown) {
    return {
      error: asLimitOrFallback(
        caught,
        FREE_PROJECT_LIMIT_MESSAGE,
        "Unable to add project."
      ),
    };
  }
}
