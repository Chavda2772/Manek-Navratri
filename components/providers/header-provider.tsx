"use client";

import { Header } from "@/components/header";
import { tran } from "@/lib/languages/i18n";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BackHeaderStandalone } from "@/components/back-header";

export interface HeaderMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

export interface HeaderConfig {
  type?: "app" | "back" | "none";
  title?: string;
  description?: string;
  backUrl?: Route;
  menuItems?: HeaderMenuItem[];
  isProfile?: boolean;
  isMobileList?: boolean;
}

interface HeaderContextType {
  headerConfig: HeaderConfig | null;
  setHeaderConfig: React.Dispatch<React.SetStateAction<HeaderConfig | null>>;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

export const useHeader = () => {
  return useContext(HeaderContext);
};

export function getDefaultHeaderConfig(pathname: string): HeaderConfig {
  if (pathname === "/dashboard" || pathname === "/") {
    return { type: "app", title: tran("dashboard.title") };
  }
  if (pathname === "/admin") {
    return { type: "app", title: tran("admin.title") };
  }
  if (pathname === "/admin/user/add") {
    return { type: "back", title: "Add New User", backUrl: "/admin" as any };
  }
  if (pathname.startsWith("/admin/user/") && pathname.endsWith("/edit")) {
    return { type: "back", title: "Edit User (Admin)", backUrl: "/admin" as any };
  }
  if (pathname.startsWith("/admin/user/")) {
    return { type: "back", title: "User Details", backUrl: "/admin" as any };
  }
  if (pathname === "/settings") {
    return { type: "app", title: tran("settings.title") };
  }
  if (pathname === "/settings/profile") {
    return { type: "back", title: tran("profile.title"), backUrl: "/settings" as any };
  }
  if (pathname === "/settings/profile/edit") {
    return { type: "back", title: tran("profile.edit.title"), backUrl: "/settings" as any };
  }
  if (pathname === "/settings/security") {
    return { type: "back", title: tran("security.title"), backUrl: "/settings" as any };
  }
  if (pathname === "/settings/session-management") {
    return { type: "back", title: tran("session.title"), backUrl: "/settings" as any };
  }
  if (pathname === "/settings/link-account") {
    return { type: "back", title: tran("linked_accounts.title"), backUrl: "/settings" as any };
  }
  if (pathname === "/settings/danger") {
    return { type: "back", title: tran("danger.title"), backUrl: "/settings" as any };
  }
  if (pathname === "/logout") {
    return { type: "back", title: "Logout", backUrl: "/dashboard" as any };
  }

  // Fallback for any other page under (app)
  return { type: "app", title: tran("dashboard.title") };
}

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);
  const pathname = usePathname();

  // Reset page-level header config override whenever route changes
  useEffect(() => {
    setHeaderConfig(null);
  }, [pathname]);

  return (
    <HeaderContext.Provider value={{ headerConfig, setHeaderConfig }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function PersistentHeader() {
  const ctx = useHeader();
  const pathname = usePathname();

  const defaultConfig = getDefaultHeaderConfig(pathname);
  const config = ctx?.headerConfig
    ? { ...defaultConfig, ...ctx.headerConfig }
    : defaultConfig;

  if (config.type === "none") {
    return null;
  }

  if (config.type === "back") {
    return (
      <BackHeaderStandalone
        title={config.title}
        description={config.description}
        backUrl={config.backUrl}
        menuItems={config.menuItems}
      />
    );
  }

  return (
    <Header
      title={config.title || ""}
      isProfile={config.isProfile ?? true}
      isMobileList={config.isMobileList ?? true}
    />
  );
}
