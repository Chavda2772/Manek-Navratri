import { FooterButtons } from "@/components/footer-buttons";
import { AdminStats } from "./admin-stats";
import { UserList } from "./user-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

interface UserTabProp {
    totalUsers: number
    activeUsers: number
    bannedUsers: number
    adminUsers: number
}

export function UserTab({ totalUsers, activeUsers, bannedUsers, adminUsers }: UserTabProp) {
    return (
        <>
            <AdminStats
                totalUsers={totalUsers}
                activeUsers={activeUsers}
                bannedUsers={bannedUsers}
                adminUsers={adminUsers}
            />

            <UserList />

            <FooterButtons bottomSpace={true}>
                <Button onClick={() => { redirect('/admin/user/add' as any) }} className="h-14 w-14 md:w-auto md:px-12 rounded-full md:gap-3 font-semibold uppercase bg-primary text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 p-0 md:py-2">
                    <Plus className="size-5 md:size-6" />
                    <span className="hidden md:block text-center font-black tracking-[0.2em] text-sm">
                        Add User
                    </span>
                </Button>
            </FooterButtons>
        </>
    );
}
