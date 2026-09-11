import {
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href:
    | "/dashboard"
    | "/clients"
    | "/projects"
    | "/invoices"
    | "/pricing"
    | "/settings";
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Clients", href: "/clients", icon: Users },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Invoices", href: "/invoices", icon: FileText },
  { title: "Pricing", href: "/pricing", icon: CreditCard },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function getPageTitle(pathname: string) {
  return navItems.find((item) => item.href === pathname)?.title ?? "ClientFlow";
}
