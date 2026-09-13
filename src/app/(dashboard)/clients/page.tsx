import type { Metadata } from "next";

import { ClientsView } from "@/components/clients/clients-view";

export const metadata: Metadata = {
  title: "Clients",
};

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return <ClientsView />;
}
