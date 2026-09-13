"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, LogOut } from "lucide-react";

import { getInitials } from "@/components/clients/data";
import {
  fetchOrCreateProfile,
  updateProfileRecord,
} from "@/components/settings/api";
import type { Profile } from "@/components/settings/data";
import { logout } from "@/lib/auth/actions";
import { createBillingPortalSession } from "@/lib/billing/actions";
import {
  isPaidPlan,
  planLabel,
  subscriptionStatusLabel,
} from "@/lib/billing/plans";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptyProfile: Profile = {
  id: "",
  fullName: "",
  email: "",
  companyName: "",
  phone: "",
  plan: "free",
  subscriptionStatus: null,
};

export function SettingsView() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoutPending, startLogout] = useTransition();
  const [portalPending, startPortal] = useTransition();
  const [portalError, setPortalError] = useState<string | null>(null);

  function applyProfile(nextProfile: Profile) {
    setProfile(nextProfile);
    setFullName(nextProfile.fullName);
    setCompanyName(nextProfile.companyName);
    setPhone(nextProfile.phone);
  }

  async function loadProfile() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const nextProfile = await fetchOrCreateProfile();
      applyProfile(nextProfile);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetchOrCreateProfile()
      .then((nextProfile) => {
        if (!cancelled) {
          applyProfile(nextProfile);
          setError(null);
          setLoading(false);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load profile."
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateProfileRecord({
        fullName,
        companyName,
        phone,
      });
      applyProfile(updated);
      setSuccess("Profile saved.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const avatarLabel = fullName.trim() || profile.email || "Account";
  const paidPlan = isPaidPlan(profile.plan);

  function handleManageSubscription() {
    if (portalPending || loading || !paidPlan) {
      return;
    }

    setPortalError(null);
    startPortal(async () => {
      const result = await createBillingPortalSession();

      if (result?.error) {
        setPortalError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your profile and account
        </p>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <p role="alert">{error}</p>
          {loading ? null : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadProfile()}
            >
              Retry
            </Button>
          )}
        </div>
      ) : null}

      {success ? (
        <p
          role="status"
          className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
        >
          {success}
        </p>
      ) : null}

      <Card className="max-w-2xl bg-card shadow-xs">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading profile...
            </div>
          ) : (
            <form className="grid gap-6" onSubmit={handleSubmit}>
              <div className="flex items-center gap-4">
                <Avatar className="size-16 data-[size=lg]:size-16" size="lg">
                  <AvatarFallback className="text-base">
                    {getInitials(avatarLabel)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{avatarLabel}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {profile.email || "No email on this account"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="settings-full-name">Full Name</Label>
                  <Input
                    id="settings-full-name"
                    name="fullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => {
                      setSuccess(null);
                      setFullName(event.target.value);
                    }}
                    required
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input
                    id="settings-email"
                    name="email"
                    type="email"
                    value={profile.email}
                    readOnly
                    disabled
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="settings-company">Company Name</Label>
                  <Input
                    id="settings-company"
                    name="companyName"
                    autoComplete="organization"
                    value={companyName}
                    onChange={(event) => {
                      setSuccess(null);
                      setCompanyName(event.target.value);
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="settings-phone">Phone</Label>
                  <Input
                    id="settings-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => {
                      setSuccess(null);
                      setPhone(event.target.value);
                    }}
                  />
                </div>
              </div>

              <div>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : null}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl bg-card shadow-xs">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Your current ClientFlow plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-sm font-medium">
                  {loading ? "Loading..." : planLabel(profile.plan)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription Status</p>
                <p className="text-sm font-medium">
                  {loading
                    ? "Loading..."
                    : subscriptionStatusLabel(profile.subscriptionStatus)}
                </p>
              </div>
            </div>
            {paidPlan ? (
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={loading || portalPending}
                onClick={handleManageSubscription}
              >
                {portalPending ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : null}
                {portalPending
                  ? "Opening portal..."
                  : profile.plan === "business"
                    ? "Manage / Downgrade"
                    : "Manage / Upgrade"}
              </Button>
            ) : (
              <Button
                className="w-full sm:w-auto"
                nativeButton={false}
                render={<Link href="/pricing" />}
              >
                Upgrade Plan
              </Button>
            )}
          </div>
          {portalError ? (
            <p role="alert" className="text-sm text-destructive">
              {portalError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="max-w-2xl bg-card shadow-xs">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            You are signed in with this email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="truncate text-sm font-medium">
              {loading ? "Loading..." : profile.email || "No email on this account"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={logoutPending}
            onClick={() => {
              startLogout(() => {
                void logout();
              });
            }}
          >
            <LogOut data-icon="inline-start" />
            {logoutPending ? "Logging out..." : "Logout"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
