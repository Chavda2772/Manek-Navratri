"use client";

import { hasAnyRole, useSession } from "@/lib/auth/auth-client";
import { UserRole } from "@/lib/generated/prisma/enums";
import { tran } from "@/lib/languages/i18n";
import { LayoutDashboard, Settings, Tickets } from "lucide-react";
import { TabItem } from "./tab-item";

export const useNavItems = () => {
  const { data: session } = useSession();
  const isAllowAccs = hasAnyRole(session?.user?.role, [UserRole.admin, UserRole.moderator]);

  const navItems: TabItem[] = [
    { id: "dashboard", label: tran("nav.dashboard"), icon: <LayoutDashboard size={20} />, href: "/dashboard" },
    ...(isAllowAccs ? [{ id: "events", label: tran("nav.events"), icon: <Tickets size={20} />, href: "/events" }] : []),
    { id: "settings", label: tran("nav.settings"), icon: <Settings size={20} />, href: "/settings" },
  ];

  return navItems;
};