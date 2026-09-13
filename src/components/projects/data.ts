export type ProjectStatus = "Planning" | "In Progress" | "Completed" | "On Hold";

export type Project = {
  id: string;
  clientId: string;
  name: string;
  client: string;
  description: string;
  status: ProjectStatus;
  value: number;
  startDate: string;
  dueDate: string;
  progress: number;
};

export type ProjectFormValues = {
  name: string;
  clientId: string;
  description: string;
  status: ProjectStatus;
  value: number;
  startDate: string;
  dueDate: string;
  progress: number;
};

export type ProjectClientOption = {
  id: string;
  name: string;
  company: string;
};

export type ProjectRow = {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  description: string;
  status: string;
  value: number | string;
  progress: number;
  start_date: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  client:
    | {
        id: string;
        full_name: string;
        company: string;
      }
    | {
        id: string;
        full_name: string;
        company: string;
      }[]
    | null;
};

export const projectStatuses: ProjectStatus[] = [
  "Planning",
  "In Progress",
  "Completed",
  "On Hold",
];

export const projectStatusFilters = ["All", ...projectStatuses] as const;

export type ProjectStatusFilter = (typeof projectStatusFilters)[number];

export const PROJECT_SELECT = `
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

export function toProjectPayload(userId: string, values: ProjectFormValues) {
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

export function isProjectStatus(value: string): value is ProjectStatus {
  return projectStatuses.includes(value as ProjectStatus);
}

export function getProjectClientLabel(client: {
  name?: string;
  company?: string;
  full_name?: string;
}) {
  const company = client.company?.trim() ?? "";
  const name = (client.full_name ?? client.name ?? "").trim();
  return company || name || "Unknown client";
}

export function mapProjectRow(row: ProjectRow): Project {
  const relatedClient = Array.isArray(row.client) ? row.client[0] : row.client;
  const value = Number(row.value);

  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    client: relatedClient
      ? getProjectClientLabel(relatedClient)
      : "Unknown client",
    description: row.description,
    status: isProjectStatus(row.status) ? row.status : "Planning",
    value: Number.isFinite(value) ? value : 0,
    startDate: row.start_date,
    dueDate: row.due_date,
    progress: Math.min(100, Math.max(0, row.progress ?? 0)),
  };
}

export function formatProjectValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatProjectDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${monthLabels[month - 1]} ${day}, ${year}`;
}

export function filterProjects(
  projects: Project[],
  query: string,
  status: ProjectStatusFilter
) {
  const value = query.trim().toLowerCase();

  return projects.filter((project) => {
    const matchesStatus = status === "All" || project.status === status;
    const matchesQuery =
      !value ||
      [project.name, project.client, project.description, project.status]
        .join(" ")
        .toLowerCase()
        .includes(value);

    return matchesStatus && matchesQuery;
  });
}

export function getProjectSummary(projects: Project[]) {
  return {
    total: projects.length,
    inProgress: projects.filter((project) => project.status === "In Progress")
      .length,
    completed: projects.filter((project) => project.status === "Completed")
      .length,
    value: projects.reduce((sum, project) => sum + project.value, 0),
  };
}
