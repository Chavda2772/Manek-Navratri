import { getEventDetailsAction } from "@/actions/event.actions";
import { getEventRegistrationsAction } from "@/actions/registration.actions";
import { getUserSession } from "@/lib/auth/auth";
import { UserRole } from "@/lib/generated/prisma/enums";
import { hasAnyRole } from "@/lib/auth/permissions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, UserCheck, Sparkles } from "lucide-react";
import { RegistrationsClient } from "./components/registrations-client";
import MobileNav from "@/components/tab/mobile-tab";

export const dynamic = "force-dynamic";

interface RegistrationsPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventRegistrationsPage({ params }: RegistrationsPageProps) {
  const session = await getUserSession();
  if (!hasAnyRole(session?.user?.role, [UserRole.admin, UserRole.moderator])) {
    redirect("/dashboard");
  }

  const { eventId } = await params;
  const [eventRes, regRes] = await Promise.all([
    getEventDetailsAction(eventId),
    getEventRegistrationsAction(eventId),
  ]);

  if (!eventRes.success || !eventRes.event) {
    notFound();
  }

  const { event } = eventRes;
  const registrations = regRes.success ? regRes.registrations || [] : [];
  const stats = regRes.success && regRes.stats
    ? regRes.stats
    : { totalRegistrations: registrations.length, totalPeople: registrations.length };

  return (
    <>
      <div className="flex-1 space-y-6 p-4 sm:p-6 pb-34 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold border border-pink-500/20">
                <Sparkles className="w-3 h-3" /> Public Registrations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Attendee Registrations
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage public attendee registrations and family groups for{" "}
              <span className="font-semibold text-foreground">{event.title}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 px-4 rounded-2xl bg-muted/50 border border-border text-center">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Total Registrations
              </span>
              <span className="text-xl font-black text-foreground">
                {stats.totalRegistrations}
              </span>
            </div>
            <div className="p-3 px-4 rounded-2xl bg-muted/50 border border-border text-center">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Total People
              </span>
              <span className="text-xl font-black text-pink-600 dark:text-pink-400">
                {stats.totalPeople}
              </span>
            </div>
          </div>
        </div>

        {/* Client Component */}
        <RegistrationsClient
          eventId={eventId}
          event={event}
          initialRegistrations={registrations}
          stats={stats}
        />
      </div>

      <MobileNav />
    </>
  );
}
