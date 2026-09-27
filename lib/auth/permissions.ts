import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Access Control Statements defining available resources and actions
 */
export const statement = {
  ...defaultStatements,
} as const;

/**
 * Access Control Instance
 */
export const ac = createAccessControl(statement);

/**
 * 1. Admin Role: Full access to all user and session management operations
 */
export const admin = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});

/**
 * 2. Moderator Role: Permissions to inspect, update, ban/unban users, and manage active sessions.
 * Restricted from deleting users, altering roles, or changing passwords/emails.
 */
export const moderator = ac.newRole({
  user: ["get", "list", "ban", "update"],
  session: ["list", "revoke"],
});

/**
 * 3. User Role: Default application user with standard self-service permissions
 */
export const user = ac.newRole({
  user: [],
  session: [],
});

/**
 * Better Auth Roles Registry for Admin Plugin
 */
export const roles = {
  admin,
  user,
  moderator,
} as const;

/**
 * Role Constants and Types
 */
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MODERATOR: "moderator",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export const ALL_ROLES: Role[] = [ROLES.ADMIN, ROLES.USER, ROLES.MODERATOR];

/**
 * Parse comma-separated role string into an array of roles.
 * Defaults to ["user"] if empty.
 */
export function parseRoles(roleString?: string | null): Role[] {
  if (!roleString || typeof roleString !== "string") {
    return [ROLES.USER];
  }

  const parsed = roleString
    .split(",")
    .sort()
    .map((r) => r.trim().toLowerCase())
    .filter((r): r is Role => ALL_ROLES.includes(r as Role));

  return parsed.length > 0 ? Array.from(new Set(parsed)) : [ROLES.USER];
}

/**
 * Formats an array of roles or role string into a normalized comma-separated string.
 */
export function stringifyRoles(rolesInput: string[] | string): string {
  if (Array.isArray(rolesInput)) {
    const validRoles = rolesInput
      .sort()
      .map((r) => r.trim().toLowerCase())
      .filter((r): r is Role => ALL_ROLES.includes(r as Role));
    const unique = Array.from(new Set(validRoles));
    return unique.length > 0 ? unique.join(",") : ROLES.USER;
  }

  return parseRoles(rolesInput).join(",");
}

/**
 * Check if a user's role string contains a specific role.
 */
export function hasRole(roleString: string | null | undefined, targetRole: Role): boolean {
  const currentRoles = parseRoles(roleString);
  return currentRoles.includes(targetRole);
}

/**
 * Check if a user's role string contains ANY of the given target roles.
 */
export function hasAnyRole(roleString: string | null | undefined, targetRoles: Role[]): boolean {
  const currentRoles = parseRoles(roleString);
  return targetRoles.some((target) => currentRoles.includes(target));
}

/**
 * Check if a user's role string contains ALL of the given target roles.
 */
export function hasAllRoles(roleString: string | null | undefined, targetRoles: Role[]): boolean {
  const currentRoles = parseRoles(roleString);
  return targetRoles.every((target) => currentRoles.includes(target));
}

/**
 * Check whether a user's multi-roles satisfy a specific permission set.
 */
export function checkUserPermission(
  roleString: string | null | undefined,
  permissions: {
    user?: (typeof defaultStatements.user)[number][];
    session?: (typeof defaultStatements.session)[number][];
  }
): boolean {
  const currentRoles = parseRoles(roleString);
  for (const r of currentRoles) {
    const roleDef = roles[r];
    if (roleDef && roleDef.authorize(permissions).success) {
      return true;
    }
  }
  return false;
}
