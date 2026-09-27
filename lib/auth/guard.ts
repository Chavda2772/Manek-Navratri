import { headers } from "next/headers";
import { auth } from "./auth";
import { resourceStatement, roles, RoleName } from "./permissions";
import { UserRole } from "../generated/prisma/enums";

type PermissionsStatement = typeof resourceStatement;
type Resource = keyof PermissionsStatement;

export async function requirePermission<R extends Resource>(
    resource: R,
    action: PermissionsStatement[R][number]
) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("UNAUTHORIZED");
    }

    const userRole = (session.user.role as RoleName) ?? UserRole.user;
    const roleDefinition = roles[userRole];

    // Validate action authorization for this role
    const isAuthorized = roleDefinition?.authorize({
        [resource]: [action],
    } as any);

    if (!isAuthorized?.success) {
        throw new Error("FORBIDDEN");
    }

    return { session, user: session.user };
}