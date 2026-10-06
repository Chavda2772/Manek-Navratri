import { getEventsAction } from "@/actions/event.actions";
import { AppHeader } from "@/components/header/app-header";
import MobileNav from "@/components/tab/mobile-tab";
import { getUserSession } from "@/lib/auth/auth";
import { hasAnyRole } from "@/lib/auth/permissions";
import { UserRole } from "@/lib/generated/prisma/enums";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { CreateEventDialog } from "./components/create-event-dialog";
import EventsCard from "./components/event-card";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const session = await getUserSession();
  if (!hasAnyRole(session?.user?.role, [UserRole.admin, UserRole.moderator])) {
    redirect("/dashboard");
  }

  const { events } = await getEventsAction();

  return (
    <>
      <AppHeader title="Events" />
      <div className="flex-1 space-y-8 p-6 max-w-7xl mx-auto w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Events Registry</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage events, configure ticket issuance, and launch access controllers.
            </p>
          </div>
          <CreateEventDialog />
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-card border border-border text-muted-foreground space-y-4">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/60" />
            <h3 className="text-lg font-bold text-foreground">No Events Created Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Click &quot;Create New Event&quot; above to set up your first event and start issuing QR pass tokens.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt: any) => (
              <EventsCard key={evt.id} evt={evt} />
            ))}
          </div>
        )}
      </div>

      <MobileNav />
    </>
  );
}
