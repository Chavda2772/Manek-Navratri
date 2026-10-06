import { getEventDetailsAction } from "@/actions/event.actions";
import { getUserSession } from "@/lib/auth/auth";
import { UserRole } from "@/lib/generated/prisma/enums";
import { Activity, ArrowRight, Calendar, MapPin, Scan, Ticket } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventDetailHeader } from "./components/event-detail-header";

import MobileNav from "@/components/tab/mobile-tab";
import { hasAnyRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

interface EventPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const session = await getUserSession();
  if (!hasAnyRole(session?.user?.role, [UserRole.admin, UserRole.moderator])) {
    redirect("/dashboard");
  }

  const { eventId } = await params;
  const res = await getEventDetailsAction(eventId);

  if (!res.success || !res.event) {
    notFound();
  }

  const { event, stats } = res;

  return (
    <>
      <EventDetailHeader event={event} />

      <div className="flex-1 space-y-8 p-4 sm:p-6 pb-34 max-w-7xl mx-auto w-full">

        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-lg p-5 sm:p-8 dark:bg-gradient-to-r dark:from-zinc-900 dark:via-zinc-900 dark:to-purple-950/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-semibold">
                  <Calendar className="w-3.5 h-3.5" /> ID: {event.id}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${event.status === "ON_HOLD"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : event.status === "COMPLETED"
                      ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    }`}
                >
                  {event.status === "ON_HOLD" && "⏸ ON HOLD"}
                  {event.status === "COMPLETED" && "✓ COMPLETED"}
                  {(!event.status || event.status === "ACTIVE") && "✓ ACTIVE"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground break-words">{event.title}</h1>
              {event.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" /> {event.location}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2.5 sm:gap-3 w-full md:w-auto">
              <Link
                href={`/events/${event.id}/passes`}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Ticket className="w-4 h-4" /> Manage Passes ({event._count.passes})
              </Link>
              <Link
                href={`/events/${event.id}/scanner`}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-pink-600 hover:bg-pink-500 text-white transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Scan className="w-4 h-4" /> Open Gate Scanner
              </Link>
              <Link
                href={`/events/${event.id}/check-ins`}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all flex items-center justify-center gap-2 border border-border w-full sm:w-auto"
              >
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Check-in Logs
              </Link>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground">Total Issued Passes</span>
            <p className="mt-2 text-2xl font-bold text-foreground">{event._count.passes}</p>
            <span className="text-[11px] text-muted-foreground font-medium">Capacity: {event.capacity}</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground">Active Passes</span>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.activePassesCount || 0}</p>
            <span className="text-[11px] text-muted-foreground font-medium">Unscanned & Ready</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground">Used / Checked-In</span>
            <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{stats?.approvedCount || 0}</p>
            <span className="text-[11px] text-muted-foreground font-medium">Atomic Gate Scans</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground">Scan Rejections</span>
            <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{stats?.deniedCount || 0}</p>
            <span className="text-[11px] text-muted-foreground font-medium">Double-scans / Invalid</span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Passes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Recent Issued Passes
              </h2>
              <Link
                href={`/events/${event.id}/passes`}
                className="text-xs font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
              >
                Manage Passes <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              {event.passes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No passes issued yet</p>
              ) : (
                event.passes.slice(0, 6).map((pass: any) => (
                  <div
                    key={pass.id}
                    className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{pass.holderName}</h4>
                      <p className="text-xs text-muted-foreground">{pass.holderEmail}</p>
                      <code className="text-[10px] text-muted-foreground">{pass.token}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pass.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                          }`}
                      >
                        {pass.status}
                      </span>
                      <Link
                        href={`/p/${pass.token}`}
                        target="_blank"
                        className="text-xs text-pink-600 dark:text-pink-400 hover:underline font-medium"
                      >
                        View QR
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Scan Audit */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Recent Gate Activity
              </h2>
              <Link
                href={`/events/${event.id}/check-ins`}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
              >
                View Full Log <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              {event.checkIns.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No scan logs yet</p>
              ) : (
                event.checkIns.slice(0, 6).map((ci: any) => (
                  <div
                    key={ci.id}
                    className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ci.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            }`}
                        >
                          {ci.status}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {ci.pass?.holderName || "Unknown Token"}
                        </span>
                      </div>
                      {ci.rejectionReason && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400">{ci.rejectionReason}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(ci.scannedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <MobileNav />
    </>
  );
}
