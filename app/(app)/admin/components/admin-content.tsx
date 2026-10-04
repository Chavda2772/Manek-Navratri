"use client";

import AppTabs from "@/components/tab/app-tabs";
import { hasRole } from "@/lib/auth/permissions";
import { tran } from "@/lib/languages/i18n";
import { useAdminUsers } from "@/tanstacks/admin";
import { Database, Settings as SettingsIcon, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { AdminSkeleton } from "./admin-skeleton";
import { UserTab } from "./user-tab";

const AppSettingsTab = dynamic(
    () => import("./app-settings-tab").then((mod) => mod.AppSettingsTab),
    {
        loading: () => <AdminSkeleton />,
    }
);

const AdminStorageManager = dynamic(
    () => import("./storage-manager").then((mod) => mod.AdminStorageManager),
    {
        loading: () => <AdminSkeleton />,
    }
);

export function AdminContent() {
    const { data: users, isLoading } = useAdminUsers();

    if (isLoading) {
        return <AdminSkeleton />;
    }

    if (!users) return null;

    const totalUsers = users.length;
    const adminUsers = users.filter((u: any) => hasRole(u.role, "admin")).length;
    const bannedUsers = users.filter((u: any) => u.banned).length;
    const activeUsers = totalUsers - bannedUsers;

    return (
        <div className="flex-1 px-4 pb-34 pt-6 max-w-7xl mx-auto w-full">
            <AppTabs
                defaultTab="user-management"
                tabs={[
                    {
                        id: "user-management",
                        label: tran("admin.user_mng.title"),
                        icon: <Users size={20} />,
                        content: <UserTab
                            totalUsers={totalUsers}
                            adminUsers={adminUsers}
                            activeUsers={activeUsers}
                            bannedUsers={bannedUsers}
                        />
                    },
                    {
                        id: "application-settings",
                        label: tran("admin.app_config.title"),
                        icon: <SettingsIcon size={20} />,
                        content: <AppSettingsTab />
                    },
                    {
                        id: "storage-manager",
                        label: tran("admin.storage_mng.title"),
                        icon: <Database size={20} />,
                        content: <AdminStorageManager />
                    },
                ]}
            />
        </div>
    );
}
