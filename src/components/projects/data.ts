import { initialClients } from "@/components/clients/data";

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

export const projectClientNames = initialClients.map((client) => client.company);

export const initialProjects: Project[] = [
  {
    id: "project-1",
    clientId: "client-1",
    name: "Brand Refresh",
    client: "Acme Co",
    description: "Update brand identity, color system, and core marketing templates.",
    status: "In Progress",
    value: 12400,
    startDate: "2026-07-14",
    dueDate: "2026-09-18",
    progress: 62,
  },
  {
    id: "project-2",
    clientId: "client-2",
    name: "Website Redesign",
    client: "Northwind",
    description: "Rebuild the marketing site with a clearer services and case-study flow.",
    status: "Planning",
    value: 18000,
    startDate: "2026-09-08",
    dueDate: "2026-10-12",
    progress: 15,
  },
  {
    id: "project-3",
    clientId: "client-3",
    name: "Mobile App",
    client: "Globex",
    description: "Design and ship the first customer-facing iOS and Android experience.",
    status: "In Progress",
    value: 24500,
    startDate: "2026-06-02",
    dueDate: "2026-10-03",
    progress: 48,
  },
  {
    id: "project-4",
    clientId: "client-4",
    name: "Q3 Campaign",
    client: "Initech",
    description: "Launch the fall campaign across email, landing pages, and paid ads.",
    status: "On Hold",
    value: 6200,
    startDate: "2026-08-01",
    dueDate: "2026-10-22",
    progress: 30,
  },
  {
    id: "project-5",
    clientId: "client-6",
    name: "Brand System",
    client: "Brightline Studio",
    description: "Deliver a complete design system for product and marketing teams.",
    status: "Completed",
    value: 9800,
    startDate: "2026-05-11",
    dueDate: "2026-08-28",
    progress: 100,
  },
  {
    id: "project-6",
    clientId: "client-5",
    name: "Lab Portal",
    client: "Umbrella Labs",
    description: "Build a client portal for sample tracking and report delivery.",
    status: "Planning",
    value: 15750,
    startDate: "2026-09-15",
    dueDate: "2026-11-06",
    progress: 8,
  },
];

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
