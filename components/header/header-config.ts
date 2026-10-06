import type { Route } from "next";
import { ReactNode } from "react";

export interface HeaderMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

export interface HeaderConfig {
  title?: string;
  description?: string;
  showBack?: boolean;
  backUrl?: Route | string;
  showProfile?: boolean;
  showMobileNav?: boolean;
  menuItems?: HeaderMenuItem[];
  rightAction?: ReactNode;
}

export interface HeaderRouteRule extends HeaderConfig {
  pattern: string | RegExp;
}

export const headerRoutesConfig: HeaderRouteRule[] = [
  // Dashboard
  {
    pattern: "/dashboard",
    title: "dashboard.title",
    showBack: false
  },
  // Admin root
  {
    pattern: "/admin",
    title: "admin.title",
    showBack: true
  },
  // Admin User Add
  {
    pattern: "/admin/user/add",
    title: "Add New User",
    showBack: true,
    backUrl: "/admin",
  },
  // Admin User Edit
  {
    pattern: /^\/admin\/user\/[^/]+\/edit$/,
    title: "Edit User (Admin)",
    showBack: true,
    backUrl: "/admin",
  },
  // Admin User Details
  {
    pattern: /^\/admin\/user\/[^/]+$/,
    title: "User Details",
    showBack: true,
    backUrl: "/admin",
  },
  // Settings root
  {
    pattern: "/settings",
    title: "settings.title",
    showBack: false,
  },
  // Settings Profile
  {
    pattern: "/settings/profile",
    title: "profile.title",
    showBack: true,
    backUrl: "/settings",
  },
  // Settings Profile Edit
  {
    pattern: "/settings/profile/edit",
    title: "profile.edit.title",
    showBack: true,
    backUrl: "/settings/profile",
  },
  // Settings Security
  {
    pattern: "/settings/security",
    title: "security.title",
    showBack: true,
    backUrl: "/settings",
  },
  // Settings Sessions
  {
    pattern: "/settings/session-management",
    title: "session.title",
    showBack: true,
    backUrl: "/settings",
  },
  // Settings Linked Accounts
  {
    pattern: "/settings/link-account",
    title: "linked_accounts.title",
    showBack: true,
    backUrl: "/settings",
  },
  // Settings Danger Zone
  {
    pattern: "/settings/danger",
    title: "danger.title",
    showBack: true,
    backUrl: "/settings",
  },
  // Logout
  {
    pattern: "/logout",
    title: "Logout",
    showBack: true,
    backUrl: "/dashboard",
  },
];

/**
 * Resolves header configuration for a given pathname against registered route rules
 */
export function getHeaderConfigForPath(pathname: string, customRules?: HeaderRouteRule[]): HeaderConfig {
  const rules = customRules || headerRoutesConfig;

  for (const rule of rules) {
    if (typeof rule.pattern === "string") {
      if (rule.pattern === pathname) {
        return rule;
      }
    } else if (rule.pattern instanceof RegExp) {
      if (rule.pattern.test(pathname)) {
        return rule;
      }
    }
  }

  // Fallback heuristic for unlisted paths inside (app)
  const segments = pathname.split("/").filter(Boolean);
  const isNested = segments.length > 1;
  const parentPath = isNested ? `/${segments.slice(0, -1).join("/")}` : "/dashboard";
  const rawTitle = segments[segments.length - 1] || "Dashboard";
  const formattedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).replace(/-/g, " ");

  return {
    title: formattedTitle,
    showBack: isNested,
    backUrl: isNested ? parentPath : undefined,
    showMobileNav: !isNested,
    showProfile: true,
  };
}
