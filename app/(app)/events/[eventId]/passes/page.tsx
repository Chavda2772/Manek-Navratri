import { getEventDetailsAction } from "@/actions/event.actions";
import { BackHeader } from "@/components/header/back-header";
import MobileNav from "@/components/tab/mobile-tab";
import { getUserSession } from "@/lib/auth/auth";
import { hasAnyRole } from "@/lib/auth/permissions";
import { UserRole } from "@/lib/generated/prisma/enums";
import { notFound, redirect } from "next/navigation";
import { PassManagementClient } from "./components/pass-management-client";

export const dynamic = "force-dynamic";

interface PassesPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventPassesPage({ params }: PassesPageProps) {
  const session = await getUserSession();
  if (!hasAnyRole(session?.user?.role, [UserRole.admin, UserRole.moderator])) {
    redirect("/dashboard");
  }

  const { eventId } = await params;
  const res = await getEventDetailsAction(eventId);

  if (!res.success || !res.event) {
    notFound();
  }

  const { event } = res;

  return (
    <>
      <BackHeader title={`Passes — ${event.title}`} />

      <div className="flex-1 space-y-6 p-4 sm:p-6 pb-34 max-w-7xl mx-auto w-full">
        <PassManagementClient event={event} />
      </div>

      <MobileNav />
    </>
  );
}
