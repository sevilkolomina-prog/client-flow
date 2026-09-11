"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);

    if (hash.includes("type=recovery") || params.get("type") === "recovery") {
      window.location.replace(
        `/reset-password${window.location.search}${hash}`
      );
      return;
    }

    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
    </div>
  );
}
