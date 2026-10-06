import { getEventDetailsAction } from "@/actions/event.actions";
import { getEventRegistrationsAction } from "@/actions/registration.actions";
import { getUserSession } from "@/lib/auth/auth";
import { UserRole } from "@/lib/generated/prisma/enums";
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  Infinity as InfinityIcon,
  MapPin,
  Scan,
  Share2,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventDetailHeader } from "./components/event-detail-header";
import { RegistrationLinkDialog } from "@/components/events/registration-link-dialog";
import { EventRegisteredAttendees } from "./components/event-registered-attendees";
import MobileNav from "@/components/tab/mobile-tab";
import { hasAnyRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

interface EventPageProps {
  params: Promise<{ eventId: string }>;
}

function getEventTimingBadge(startDate: Date, endDate: Date) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now > end) {
    return {
      label: "Past Event",
      color: "bg-muted text-muted-foreground border-border",
    };
  }
  if (now >= start && now <= end) {
    return {
      label: "● Happening Now",
      color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold animate-pulse",
    };
  }
  const diffMs = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) {
    const diffHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    return {
      label: `Starts in ${diffHours}h`,
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  }
  return {
    label: `Starts in ${diffDays} days`,
    color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const session = await getUserSession();
  if (!hasAnyRole(session?.user?.role, [UserRole.admin, UserRole.moderator])) {
    redirect("/dashboard");
  }

  const { eventId } = await params;
  const [res, regRes] = await Promise.all([
    getEventDetailsAction(eventId),
    getEventRegistrationsAction(eventId),
  ]);

  if (!res.success || !res.event) {
    notFound();
  }

  const { event, stats } = res;
  const registrations = (regRes.success && regRes.registrations ? regRes.registrations : []) as any[];

  // Capacity calculation (null = unlimited)
  const isUnlimitedCapacity = event.capacity === null || event.capacity === undefined || event.capacity <= 0;
  const totalRegisteredPeople = stats?.totalRegisteredPeople || 0;
  const totalRegistrations = stats?.totalRegistrations || 0;
  const remainingCapacity = isUnlimitedCapacity || !event.capacity ? null : Math.max(0, event.capacity - totalRegisteredPeople);
  const capacityPercent = !isUnlimitedCapacity && event.capacity
    ? Math.min(100, Math.round((totalRegisteredPeople / event.capacity) * 100))
    : null;

  // Turnout calculation
  const totalPasses = event._count.passes || 0;
  const approvedScans = stats?.approvedCount || 0;
  const turnoutRate = totalPasses > 0 ? Math.round((approvedScans / totalPasses) * 100) : 0;

  // Timing badge
  const timingBadge = getEventTimingBadge(event.startDate, event.endDate);

  return (
    <>
      <EventDetailHeader event={event} />

      <div className="flex-1 space-y-6 sm:space-y-8 p-4 sm:p-6 pb-34 max-w-7xl mx-auto w-full">
        {/* ========================================================
            1. EVENT HERO & COMMAND CENTER BANNER
            ======================================================== */}
        <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-md p-5 sm:p-8 dark:bg-gradient-to-r dark:from-zinc-900 dark:via-zinc-900 dark:to-purple-950/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              {/* Status and Capability Badges */}
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

                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${timingBadge.color}`}
                >
                  {timingBadge.label}
                </span>

                {isUnlimitedCapacity ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                    <InfinityIcon className="w-3.5 h-3.5" /> Unlimited Capacity
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground border border-border">
                    Cap: {event.capacity}
                  </span>
                )}

                {event.registrationEnabled ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30">
                    <Sparkles className="w-3 h-3" /> Registration Open
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                    Registration Closed
                  </span>
                )}
              </div>

              {/* Event Title & Description */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight break-words">
                  {event.title}
                </h1>
                {event.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 mt-1">
                    {event.description}
                  </p>
                )}
              </div>

              {/* Event Dates, Times, Location Strip */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground pt-1">
                {event.location && (
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <MapPin className="w-4 h-4 text-pink-500 shrink-0" /> {event.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
                  {new Date(event.startDate).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {" – "}
                  {new Date(event.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                  {new Date(event.startDate).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
              <Link
                href={`/events/${event.id}/passes`}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all flex items-center justify-center gap-2 border border-border"
              >
                <Ticket className="w-4 h-4 text-purple-500" /> Passes ({event._count.passes})
              </Link>
              <Link
                href={`/events/${event.id}/scanner`}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all flex items-center justify-center gap-2 border border-border"
              >
                <Scan className="w-4 h-4 text-pink-500" /> Gate Scanner
              </Link>
              <Link
                href={`/events/${event.id}/check-ins`}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all flex items-center justify-center gap-2 border border-border"
              >
                <Activity className="w-4 h-4 text-emerald-500" /> Logs ({stats?.approvedCount || 0})
              </Link>
              <Link
                href={`/events/${event.id}/registrations`}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 transition-all flex items-center justify-center gap-2 border border-pink-500/25 col-span-2 sm:col-span-1"
              >
                <Users className="w-4 h-4" /> Registrations ({stats?.totalRegistrations || 0})
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. PUBLIC REGISTRATION HUB CARD
            ======================================================== */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-card border border-pink-500/25 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
              <h3 className="text-base font-bold text-foreground">
                Public Attendee Registration Hub
              </h3>
              {event.registrationEnabled ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Active Link
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  Paused
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {event.registrationId
                ? `Active public registration link: /registration/${event.registrationId}. Attendees can register themselves and up to 4 family members.`
                : "No public registration link generated yet. Click 'Generate Link' to start accepting public registrations."}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              {isUnlimitedCapacity ? (
                <span className="flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400">
                  <InfinityIcon className="w-3.5 h-3.5" /> Unlimited registrations allowed • No attendee cap
                </span>
              ) : (
                <>
                  <span>
                    Capacity: <strong className="text-foreground">{totalRegisteredPeople}</strong> /{" "}
                    {event.capacity} people ({capacityPercent}%)
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>
                    <strong className="text-pink-600 dark:text-pink-400">{remainingCapacity}</strong> spots remaining
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <RegistrationLinkDialog
              event={event}
              trigger={
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {event.registrationId ? "Share Link / QR" : "Generate Link"}
                </button>
              }
            />
            {event.registrationId && (
              <Link
                href={`/registration/${event.registrationId}`}
                target="_blank"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all border border-border flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-pink-500" /> Open Form
              </Link>
            )}
          </div>
        </div>

        {/* ========================================================
            3. DASHBOARD KPI METRICS ROW
            ======================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Metric 1: Total Registrations */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Registrations</span>
              <Users className="w-4 h-4 text-pink-500" />
            </div>
            <p className="text-2xl font-black text-pink-600 dark:text-pink-400">
              {totalRegistrations}
            </p>
            <span className="text-[11px] text-muted-foreground font-medium block">
              {totalRegisteredPeople} People Total
            </span>
          </div>

          {/* Metric 2: Capacity & Spots */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Max Capacity</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {isUnlimitedCapacity ? "No Cap" : `${capacityPercent}%`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {isUnlimitedCapacity ? (
                <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                  <InfinityIcon className="w-6 h-6" /> Unlimited
                </p>
              ) : (
                <p className="text-2xl font-black text-foreground">
                  {totalRegisteredPeople}/{event.capacity}
                </p>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground font-medium block truncate">
              {isUnlimitedCapacity
                ? `${totalRegisteredPeople} Attendees Registered`
                : `${remainingCapacity} Spots Remaining`}
            </span>
          </div>

          {/* Metric 3: Active Passes */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Active Passes</span>
              <Ticket className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.activePassesCount || 0}
            </p>
            <span className="text-[11px] text-muted-foreground font-medium block">
              of {event._count.passes} Total Issued
            </span>
          </div>

          {/* Metric 4: Gate Check-Ins & Turnout */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Gate Check-Ins</span>
              <Scan className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {approvedScans}
            </p>
            <span className="text-[11px] text-muted-foreground font-medium block">
              {turnoutRate}% Gate Turnout
            </span>
          </div>

          {/* Metric 5: Scan Rejections */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs col-span-2 sm:col-span-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Rejections</span>
              <Activity className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats?.deniedCount || 0}
            </p>
            <span className="text-[11px] text-muted-foreground font-medium block">
              Invalid token attempts
            </span>
          </div>
        </div>

        {/* ========================================================
            4. LIVE GATE SCANNER AUDIT STRIP (Compact Live Feed)
            ======================================================== */}
        {event.checkIns && event.checkIns.length > 0 && (
          <div className="p-5 rounded-3xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-sm font-bold text-foreground">
                  Recent Gate Scans ({Math.min(4, event.checkIns.length)})
                </h4>
              </div>
              <Link
                href={`/events/${event.id}/check-ins`}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                View Full Audit Logs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {event.checkIns.slice(0, 4).map((ci: any) => (
                <div
                  key={ci.id}
                  className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ci.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                          }`}
                      >
                        {ci.status}
                      </span>
                      <p className="text-xs font-bold text-foreground truncate">
                        {ci.pass?.holderName || "Gate Token"}
                      </p>
                    </div>
                    {ci.rejectionReason && (
                      <p className="text-[10px] text-rose-500 truncate">
                        {ci.rejectionReason}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {new Date(ci.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <MobileNav />
    </>
  );
}
