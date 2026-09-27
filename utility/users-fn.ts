import { ALL_ROLES, parseRoles, Role, ROLES } from "@/lib/auth/permissions";
import {
    LucideIcon,
    Shield,
    ShieldAlert,
    User,
    UserCheck,
    UserCircle,
    UserPlus
} from "lucide-react";

/**
 * UI and design configuration for a user role/type
 */
export interface UserRoleConfig {
    id: Role | string;
    label: string;
    description: string;
    icon: LucideIcon;
    accent: string;       // Convenience shortcut for colors.accent
    colors: {
        badge: string;    // Classes for role badges (bg, text, border)
        accent: string;   // Classes for soft icon container and highlights
        text: string;     // Text color class
        border: string;   // Border color class
        bg: string;       // Soft background class
    };
}

/**
 * Master Registry of User Roles and their Design Tokens.
 * Adding a new role here automatically propagates its label, icon, and colors
 * across all modals, badges, filters, and cards application-wide.
 */
export const USER_ROLE_CONFIGS: Record<string, UserRoleConfig> = {
    [ROLES.ADMIN]: {
        id: ROLES.ADMIN,
        label: "Admin",
        description: "Full system administration and control",
        icon: Shield,
        accent: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        colors: {
            badge: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20",
            accent: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
            text: "text-indigo-600 dark:text-indigo-400",
            border: "border-indigo-500/20",
            bg: "bg-indigo-500/10",
        },
    },
    [ROLES.MODERATOR]: {
        id: ROLES.MODERATOR,
        label: "Moderator",
        description: "Inspect content, moderate users, and manage active sessions",
        icon: UserCheck,
        accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        colors: {
            badge: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
            accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            text: "text-amber-600 dark:text-amber-400",
            border: "border-amber-500/20",
            bg: "bg-amber-500/10",
        },
    },
    [ROLES.USER]: {
        id: ROLES.USER,
        label: "User",
        description: "Standard self-service application access",
        icon: User,
        accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        colors: {
            badge: "bg-muted text-muted-foreground border border-border/40",
            accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            text: "text-blue-600 dark:text-blue-400",
            border: "border-blue-500/20",
            bg: "bg-blue-500/10",
        },
    },
    // Optional application-specific roles
    agent: {
        id: "agent",
        label: "Agent",
        description: "Support or agent representative access",
        icon: UserPlus,
        accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        colors: {
            badge: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
            accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            text: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-500/20",
            bg: "bg-emerald-500/10",
        },
    },
    client: {
        id: "client",
        label: "Client",
        description: "Client or customer account access",
        icon: UserCircle,
        accent: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        colors: {
            badge: "bg-purple-500/10 text-purple-600 border border-purple-500/20",
            accent: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
            text: "text-purple-600 dark:text-purple-400",
            border: "border-purple-500/20",
            bg: "bg-purple-500/10",
        },
    },
    owner: {
        id: "owner",
        label: "Owner",
        description: "Organization or property owner access",
        icon: ShieldAlert,
        accent: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        colors: {
            badge: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
            accent: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
            text: "text-orange-600 dark:text-orange-400",
            border: "border-orange-500/20",
            bg: "bg-orange-500/10",
        },
    },
};

/**
 * Primary roles selectable in admin UI, forms, and dialogs.
 */
export const USER_ROLE_OPTIONS: UserRoleConfig[] = [
    USER_ROLE_CONFIGS[ROLES.ADMIN],
    USER_ROLE_CONFIGS[ROLES.MODERATOR],
    USER_ROLE_CONFIGS[ROLES.USER],
];

/**
 * Get the design configuration for any role, with dynamic fallback for custom/future roles.
 */
export function getRoleConfig(role?: string | null): UserRoleConfig {
    if (!role) return USER_ROLE_CONFIGS[ROLES.USER];
    const normalized = role.trim().toLowerCase();
    if (USER_ROLE_CONFIGS[normalized]) {
        return USER_ROLE_CONFIGS[normalized];
    }
    // Dynamic fallback for any custom role
    const formattedLabel = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    const fallbackAccent = "bg-muted text-muted-foreground";
    return {
        id: normalized,
        label: formattedLabel,
        description: `${formattedLabel} role`,
        icon: User,
        accent: fallbackAccent,
        colors: {
            badge: "bg-muted text-muted-foreground border border-border/40",
            accent: fallbackAccent,
            text: "text-muted-foreground",
            border: "border-border/40",
            bg: "bg-muted/40",
        },
    };
}

/**
 * Returns badge styling classes for a role.
 */
export function getRoleBadgeClasses(role?: string | null): string {
    return getRoleConfig(role).colors.badge;
}

/**
 * Returns icon/accent container classes for a role.
 */
export function getRoleAccentClasses(role?: string | null): string {
    return getRoleConfig(role).colors.accent;
}

/**
 * Returns text color class for a role.
 */
export function getRoleTextColor(role?: string | null): string {
    return getRoleConfig(role).colors.text;
}

/**
 * Returns user-facing label for a role.
 */
export function getRoleLabel(role?: string | null): string {
    return getRoleConfig(role).label;
}

/**
 * Returns Lucide icon for a role.
 */
export function getRoleIcon(role?: string | null): LucideIcon {
    return getRoleConfig(role).icon;
}

/**
 * Parse a user's multi-role string and return configured role objects for display.
 * If hideSingleDefaultUser is true, hides the badge if the user ONLY has the default 'user' role.
 */
export function getDisplayRoles(roleString?: string | null, hideSingleDefaultUser = true): UserRoleConfig[] {
    const roles = parseRoles(roleString);
    if (hideSingleDefaultUser && roles.length === 1 && roles[0] === ROLES.USER) {
        return [];
    }
    return roles.map(getRoleConfig);
}

// Re-export permissions helpers for seamless usage
export { ALL_ROLES, parseRoles, ROLES, type Role } from "@/lib/auth/permissions";
