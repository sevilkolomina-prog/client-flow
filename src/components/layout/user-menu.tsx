"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";

import { logout } from "@/lib/auth/actions";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(value: string) {
  const parts = value.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase() || "CF";
}

export function UserMenu() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("ClientFlow");
  const [detail, setDetail] = useState<string | null>(null);
  const [initials, setInitials] = useState("CF");

  useEffect(() => {
    if (!getSupabaseEnv()) {
      return;
    }

    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) {
        return;
      }

      const fullName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : "";
      const email = user.email ?? "";
      const displayName = fullName || email || "Account";

      setLabel(displayName);
      setDetail(fullName && email ? email : null);
      setInitials(getInitials(displayName));
    });
  }, []);

  function handleLogout() {
    setOpen(false);
    startTransition(() => {
      void logout();
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        type="button"
        aria-label="Open user menu"
        className="relative z-30 inline-flex size-7 cursor-pointer items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar size="sm" className="pointer-events-none">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="z-[100] min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-foreground">{label}</span>
              {detail ? (
                <span className="truncate text-xs text-muted-foreground">
                  {detail}
                </span>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            router.push("/settings");
          }}
        >
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onClick={handleLogout}>
          <LogOut />
          {pending ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
