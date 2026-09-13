import type { Metadata } from "next";

import { ProjectsView } from "@/components/projects/projects-view";

export const metadata: Metadata = {
  title: "Projects",
};

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  return <ProjectsView />;
}
