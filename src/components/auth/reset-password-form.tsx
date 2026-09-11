"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { updatePassword, type AuthActionState } from "@/lib/auth/actions";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState
  );
  const [sessionState, setSessionState] = useState<
    "loading" | "ready" | "missing"
  >("loading");

  useEffect(() => {
    let cancelled = false;

    if (!getSupabaseEnv()) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setSessionState("missing");
        }
      });

      return () => {
        cancelled = true;
      };
    }

    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const code = params.get("code");

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !cancelled) {
        setSessionState("ready");
      }
    });

    const prepare = code
      ? supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) {
            throw error;
          }

          window.history.replaceState({}, "", "/reset-password");
          return supabase.auth.getUser();
        })
      : supabase.auth.getUser();

    prepare
      .then(({ data }) => {
        if (cancelled) {
          return;
        }

        if (data.user) {
          setSessionState("ready");
          return;
        }

        if (!hash.includes("type=recovery")) {
          setSessionState("missing");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSessionState("missing");
        }
      });

    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setSessionState((current) =>
          current === "loading" ? "missing" : current
        );
      }
    }, 4000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  if (sessionState === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Checking reset link...
      </div>
    );
  }

  if (sessionState === "missing") {
    return (
      <div className="grid gap-4">
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          This reset link is invalid or has expired. Request a new one.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : null}
        {pending ? "Updating password..." : "Update Password"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to Login
        </Link>
      </p>
    </form>
  );
}
