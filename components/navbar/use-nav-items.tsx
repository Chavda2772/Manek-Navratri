"use client";

import { tran } from "@/lib/languages/i18n";
import { LayoutDashboard, Settings } from "lucide-react";
import { TabItem } from "./tab-item";

export const useNavItems = () => {
  const navItems: TabItem[] = [
    { id: "dashboard", label: tran("nav.dashboard"), icon: <LayoutDashboard size={20} />, href: "/dashboard" },
    { id: "settings", label: tran("nav.settings"), icon: <Settings size={20} />, href: "/settings" },
  ];

  return navItems;
};