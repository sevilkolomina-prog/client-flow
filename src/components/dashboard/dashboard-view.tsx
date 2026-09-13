"use client";

import { useEffect, useState } from "react";

import { fetchDashboardData } from "@/components/dashboard/api";
import {
  getDashboardData,
  type DashboardData,
} from "@/components/dashboard/data";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentClients } from "@/components/dashboard/recent-clients";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { Button } from "@/components/ui/button";

const emptyDashboard = getDashboardData([], [], []);

export function DashboardView() {
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const nextData = await fetchDashboardData();
      setData(nextData);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetchDashboardData()
      .then((nextData) => {
        if (!cancelled) {
          setData(nextData);
          setError(null);
          setLoading(false);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load dashboard."
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          A snapshot of your clients, projects, and revenue.
        </p>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <p role="alert">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadDashboard()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <KpiCards kpis={data.kpis} loading={loading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentProjects projects={data.recentProjects} loading={loading} />
        <RecentClients clients={data.recentClients} loading={loading} />
      </div>

      <RecentInvoices invoices={data.recentInvoices} loading={loading} />
    </div>
  );
}
