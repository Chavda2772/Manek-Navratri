"use client";

import { deleteEventRegistrationAction } from "@/actions/registration.actions";
import { RegistrationLinkDialog } from "@/components/events/registration-link-dialog";
import { QRCodeView } from "@/components/qr-code-view";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Heart,
  History,
  Infinity as InfinityIcon,
  MapPin,
  Phone,
  QrCode,
  Scan,
  Search,
  Share2,
  Sparkles,
  Ticket,
  Trash2,
  UserCheck,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export interface EventRegistrationWithDetails {
  id: string;
  eventId: string;
  primaryName: string;
  mobileNumber: string;
  place: string;
  status: string;
  totalMembers: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
  familyMembers: Array<{
    id: string;
    registrationId?: string;
    name: string;
    relation: string;
    createdAt: string | Date;
  }>;
  passes: Array<{
    id: string;
    eventId?: string;
    token: string;
    holderName: string;
    holderEmail: string;
    status: string;
    registrationId?: string | null;
    createdAt: string | Date;
    checkIns?: Array<{
      id: string;
      scannedAt: string | Date;
      status: string;
    }>;
  }>;
}

function getRegistrationScanStats(reg: EventRegistrationWithDetails) {
  const passes = reg.passes || [];
  const totalScans = passes.reduce((sum, p) => sum + (p.checkIns?.length || 0), 0);
  const checkedInMembersCount = passes.filter((p) => (p.checkIns?.length || 0) > 0).length;
  const extraScans = Math.max(0, totalScans - checkedInMembersCount);
  const totalMembers = reg.totalMembers || Math.max(1, (reg.familyMembers?.length || 0) + 1);

  return {
    totalScans,
    checkedInMembersCount,
    extraScans,
    totalMembers,
  };
}

function getPassForMember(
  passes: EventRegistrationWithDetails["passes"] | undefined,
  memberName: string,
  isPrimary?: boolean
) {
  if (!passes || passes.length === 0) return null;
  const cleanTarget = memberName.toLowerCase().trim();

  if (isPrimary) {
    const primaryByEmail = passes.find((p) => {
      const emailPrefix = (p.holderEmail || "").split("@")[0];
      return !emailPrefix.includes("+") && p.holderName.toLowerCase().trim() === cleanTarget;
    });
    if (primaryByEmail) return primaryByEmail;
  } else {
    const familyByEmail = passes.find((p) => {
      const emailPrefix = (p.holderEmail || "").split("@")[0];
      return emailPrefix.includes("+") && p.holderName.toLowerCase().trim() === cleanTarget;
    });
    if (familyByEmail) return familyByEmail;
  }

  const exactName = passes.find((p) => p.holderName.toLowerCase().trim() === cleanTarget);
  if (exactName) return exactName;

  return passes.find((p) => cleanTarget.includes(p.holderName.toLowerCase().trim()) || p.holderName.toLowerCase().trim().includes(cleanTarget)) || null;
}

function getMemberScanStats(pass: EventRegistrationWithDetails["passes"][0] | null | undefined) {
  if (!pass) {
    return {
      pass: null,
      scanCount: 0,
      extraScans: 0,
      hasScanned: false,
      latestCheckIn: null,
      checkIns: [] as NonNullable<EventRegistrationWithDetails["passes"][0]["checkIns"]>,
    };
  }

  const checkIns = pass.checkIns || [];
  const scanCount = checkIns.length;
  const extraScans = Math.max(0, scanCount - 1);
  const hasScanned = scanCount > 0;
  const latestCheckIn = checkIns[0] || null;

  return {
    pass,
    scanCount,
    extraScans,
    hasScanned,
    latestCheckIn,
    checkIns,
  };
}

interface EventRegisteredAttendeesProps {
  eventId: string;
  event: any;
  initialRegistrations: EventRegistrationWithDetails[];
  stats?: {
    totalRegistrations?: number;
    totalPeople?: number;
    totalScans?: number;
    totalRegisteredPeople?: number;
    [key: string]: any;
  };
  showViewAllLink?: boolean;
  title?: string;
}

export function EventRegisteredAttendees({
  eventId,
  event,
  initialRegistrations,
  stats,
  showViewAllLink = true,
  title = "Registered Attendees",
}: EventRegisteredAttendeesProps) {
  const [registrations, setRegistrations] = useState<EventRegistrationWithDetails[]>(
    initialRegistrations
  );
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRegistrations.length > 0 ? initialRegistrations[0].id : null
  );
  const [mobileTab, setMobileTab] = useState<"list" | "details">("list");
  const [selectedPassForQr, setSelectedPassForQr] = useState<{
    token: string;
    holderName: string;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter registrations based on search query
  const filteredRegistrations = registrations.filter((reg) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const matchName = reg.primaryName.toLowerCase().includes(q);
    const matchMobile = reg.mobileNumber.includes(q);
    const matchPlace = reg.place.toLowerCase().includes(q);
    const matchId = reg.id.toLowerCase().includes(q);
    const matchFamily = reg.familyMembers?.some((m) =>
      m.name.toLowerCase().includes(q) || m.relation.toLowerCase().includes(q)
    );
    const matchPass = reg.passes?.some((p) =>
      p.token.toLowerCase().includes(q) || p.holderName.toLowerCase().includes(q)
    );
    return matchName || matchMobile || matchPlace || matchId || matchFamily || matchPass;
  });

  // Current selected registration
  const selectedRegistration =
    registrations.find((r) => r.id === selectedId) ||
    (filteredRegistrations.length > 0 ? filteredRegistrations[0] : null);

  const selectedScanStats = selectedRegistration
    ? getRegistrationScanStats(selectedRegistration)
    : null;
  const primaryPass = selectedRegistration
    ? getPassForMember(selectedRegistration.passes, selectedRegistration.primaryName, true)
    : null;
  const primaryStats = getMemberScanStats(primaryPass);

  const handleSelectAttendee = (id: string) => {
    setSelectedId(id);
    setMobileTab("details");
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleCopyFullSummary = (reg: EventRegistrationWithDetails) => {
    const familyStr =
      reg.familyMembers.length > 0
        ? reg.familyMembers.map((m) => `• ${m.name} (${m.relation})`).join("\n")
        : "None (Solo)";

    const passStr =
      reg.passes.length > 0
        ? reg.passes.map((p) => `• ${p.holderName}: Token ${p.token} [${p.status}]`).join("\n")
        : "No passes generated";

    const summary = `Event: ${event.title}\nRegistration ID: ${reg.id}\nPrimary Attendee: ${reg.primaryName}\nPhone: +91 ${reg.mobileNumber}\nCity/Place: ${reg.place}\nTotal Members: ${reg.totalMembers}\n\nFamily Members:\n${familyStr}\n\nEntry Passes:\n${passStr}`;

    handleCopyText(summary, "Registration summary");
  };

  const handleDeleteRegistration = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteEventRegistrationAction(eventId, id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete registration");
        return;
      }

      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      if (selectedId === id) {
        const remaining = registrations.filter((r) => r.id !== id);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
      setConfirmDeleteId(null);
      toast.success("Registration deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRelationBadgeColor = (relation: string) => {
    const r = relation.toLowerCase();
    if (r.includes("father") || r.includes("mother") || r.includes("parent")) {
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    }
    if (r.includes("wife") || r.includes("husband") || r.includes("spouse")) {
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    }
    if (r.includes("son") || r.includes("daughter") || r.includes("child")) {
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }
    if (r.includes("brother") || r.includes("sister") || r.includes("sibling")) {
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    }
    return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
  };

  const totalEventScans =
    stats?.totalScans ??
    registrations.reduce(
      (sum, r) => sum + (r.passes || []).reduce((pSum, p) => pSum + (p.checkIns?.length || 0), 0),
      0
    );

  return (
    <div className="space-y-4">
      {/* Section Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                {title}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30">
                {registrations.length} Registrations
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Scan className="w-3 h-3" />
                {totalEventScans} Total Scans
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Click any registered user to inspect their group, family members, and entry passes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showViewAllLink && (
            <Link
              href={`/events/${eventId}/registrations`}
              className="text-xs font-bold text-pink-600 hover:text-pink-500 dark:text-pink-400 dark:hover:text-pink-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/15 border border-pink-500/20 transition-all"
            >
              Manage All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <RegistrationLinkDialog
            event={event}
            trigger={
              <button
                type="button"
                className="text-xs font-bold text-foreground hover:text-pink-600 dark:hover:text-pink-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-pink-500" />
                Share Link
              </button>
            }
          />
        </div>
      </div>

      {/* Mobile Segmented Toggle (visible only below lg) */}
      <div className="flex lg:hidden rounded-2xl bg-muted/60 p-1 border border-border">
        <button
          type="button"
          onClick={() => setMobileTab("list")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${mobileTab === "list"
            ? "bg-card text-foreground shadow-sm border border-border"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Users className="w-3.5 h-3.5 text-pink-500" />
          Attendees List ({filteredRegistrations.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("details")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${mobileTab === "details"
            ? "bg-card text-foreground shadow-sm border border-border"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-pink-500" />
          {selectedRegistration ? selectedRegistration.primaryName : "Details"}
        </button>
      </div>

      {/* Master-Detail 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================
            LEFT COLUMN: Registered Attendees List (5 cols on lg)
            ======================================================== */}
        <div
          className={`lg:col-span-5 rounded-3xl bg-card border border-border shadow-sm overflow-hidden flex flex-col ${mobileTab === "list" ? "block" : "hidden lg:flex"
            }`}
        >
          {/* Search Box Header */}
          <div className="p-4 border-b border-border bg-card/60 backdrop-blur-sm space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by name, phone, place, or family..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 h-10 rounded-xl text-xs font-medium bg-muted/40 border-border focus:bg-card transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
              <span>
                Showing <strong className="text-foreground">{filteredRegistrations.length}</strong> of{" "}
                <strong className="text-foreground">{registrations.length}</strong> attendees
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-pink-600 dark:text-pink-400 font-semibold hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="p-3 space-y-2 max-h-[660px] overflow-y-auto">
            {filteredRegistrations.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-muted-foreground">
                  <Users className="w-6 h-6 opacity-60" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">
                    {search ? "No matching registrations" : "No attendees registered yet"}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    {search
                      ? "No registered attendee matched your search query. Try another keyword."
                      : "Public registration has not received any submissions for this event yet."}
                  </p>
                </div>
                {search ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSearch("")}
                    className="rounded-xl text-xs font-semibold h-8 cursor-pointer"
                  >
                    Clear Search
                  </Button>
                ) : (
                  <RegistrationLinkDialog
                    event={event}
                    trigger={
                      <Button
                        size="sm"
                        className="rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Share Registration Link
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              filteredRegistrations.map((reg) => {
                const isSelected = selectedRegistration?.id === reg.id;
                const hasFamily = reg.familyMembers && reg.familyMembers.length > 0;
                const scanStats = getRegistrationScanStats(reg);

                return (
                  <div
                    key={reg.id}
                    onClick={() => handleSelectAttendee(reg.id)}
                    className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer text-left group ${isSelected
                      ? "bg-pink-500/10 border-pink-500/50 shadow-sm dark:bg-pink-950/30 dark:border-pink-500/40"
                      : "bg-card hover:bg-muted/50 border-border hover:border-pink-500/30"
                      }`}
                  >
                    {/* Active Indicator Bar */}
                    {isSelected && (
                      <span className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-pink-500" />
                    )}

                    <div className="flex items-start justify-between gap-3">
                      {/* Avatar & Main Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${isSelected
                            ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm"
                            : "bg-muted text-muted-foreground border border-border"
                            }`}
                        >
                          {getInitials(reg.primaryName)}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <h4
                              className={`text-sm font-bold truncate ${isSelected ? "text-pink-600 dark:text-pink-400" : "text-foreground"
                                }`}
                            >
                              {reg.primaryName}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-pink-500 shrink-0" />
                              +91 {reg.mobileNumber}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-purple-500 shrink-0" />
                              {reg.place}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/25">
                              <Users className="w-2.5 h-2.5" />
                              {reg.totalMembers} {reg.totalMembers === 1 ? "Person" : "People"}
                            </span>

                            {hasFamily && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                +{reg.familyMembers.length} Family
                              </span>
                            )}

                            {scanStats.totalScans > 0 ? (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <Scan className="w-2.5 h-2.5" />
                                  {scanStats.totalScans} {scanStats.totalScans === 1 ? "Scan" : "Scans"}
                                </span>

                                {scanStats.extraScans > 0 && (
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                                    title={`${scanStats.checkedInMembersCount} member(s) scanned + ${scanStats.extraScans} extra re-entries`}
                                  >
                                    +{scanStats.extraScans} extra
                                  </span>
                                )}

                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-muted-foreground bg-muted/60">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                  {scanStats.checkedInMembersCount}/{scanStats.totalMembers} Entered
                                </span>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-muted-foreground bg-muted/60">
                                <Ticket className="w-2.5 h-2.5 opacity-60" />
                                0 Scans • {reg.passes?.length || reg.totalMembers} Passes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Chevron & Time */}
                      <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${isSelected
                            ? "text-pink-600 dark:text-pink-400 translate-x-0.5"
                            : "text-muted-foreground/40 group-hover:text-muted-foreground"
                            }`}
                        />
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(reg.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: Registered User Details & Family Members
            (Replaces Recent Gate Activity - 7 cols on lg)
            ======================================================== */}
        <div
          className={`lg:col-span-7 rounded-3xl bg-card border border-border shadow-sm p-5 sm:p-7 space-y-6 ${mobileTab === "details" ? "block" : "hidden lg:block"
            }`}
        >
          {/* Mobile Back to List Button */}
          <div className="flex lg:hidden items-center justify-between pb-3 border-b border-border">
            <button
              type="button"
              onClick={() => setMobileTab("list")}
              className="text-xs font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Attendees List
            </button>
            <span className="text-xs text-muted-foreground">Attendee Details</span>
          </div>

          {!selectedRegistration ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto text-muted-foreground">
                <UserCheck className="w-7 h-7 opacity-50" />
              </div>
              <h4 className="text-base font-bold text-foreground">No Attendee Selected</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Select any registered user from the list to view their complete contact information,
                accompanying family members, and gate pass QR codes.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Attendee Header Banner Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-card border border-pink-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white flex items-center justify-center text-lg font-black shadow-md shrink-0">
                    {getInitials(selectedRegistration.primaryName)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground bg-card/80 px-2 py-0.5 rounded-md border border-border">
                        ID: {selectedRegistration.id.slice(-8)}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {selectedRegistration.status}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30">
                        {selectedRegistration.totalMembers}{" "}
                        {selectedRegistration.totalMembers === 1 ? "Person" : "People"}
                      </span>

                      {selectedScanStats && selectedScanStats.totalScans > 0 ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Scan className="w-3 h-3" />
                          {selectedScanStats.totalScans} Total {selectedScanStats.totalScans === 1 ? "Scan" : "Scans"}
                          {selectedScanStats.extraScans > 0 && ` (+${selectedScanStats.extraScans} extra)`}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          0 Gate Scans
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground">
                      {selectedRegistration.primaryName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyFullSummary(selectedRegistration)}
                    className="rounded-xl text-xs font-semibold h-9 px-3 border-border hover:bg-muted/80 cursor-pointer"
                    title="Copy full summary"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5 text-pink-500" />
                    Copy Info
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteId(selectedRegistration.id)}
                    className="rounded-xl text-xs font-semibold h-9 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete registration"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Group Gate Scans Overview KPI Grid */}
              {selectedScanStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Scan className="w-3.5 h-3.5" /> Total Scans
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {selectedScanStats.totalScans}
                    </p>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {selectedScanStats.extraScans > 0
                        ? `${selectedScanStats.checkedInMembersCount} initial + ${selectedScanStats.extraScans} re-entries`
                        : selectedScanStats.totalScans > 0
                          ? "Single entries verified"
                          : "No gate scans yet"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-pink-500" /> Members In
                      </span>
                      <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">
                        {Math.round(
                          (selectedScanStats.checkedInMembersCount / Math.max(1, selectedScanStats.totalMembers)) * 100
                        )}%
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-foreground">
                      {selectedScanStats.checkedInMembersCount}
                      <span className="text-xs font-normal text-muted-foreground">
                        /{selectedScanStats.totalMembers}
                      </span>
                    </p>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {selectedScanStats.checkedInMembersCount === selectedScanStats.totalMembers
                        ? "✓ Entire group entered"
                        : `${selectedScanStats.totalMembers - selectedScanStats.checkedInMembersCount} pending entry`}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                        <InfinityIcon className="w-3.5 h-3.5" /> Extra Scans
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                      +{selectedScanStats.extraScans}
                    </p>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {selectedScanStats.extraScans > 0
                        ? "Multi-use pass re-entries"
                        : "No re-entries logged"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5 text-cyan-500" /> Pass Tokens
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Active
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-foreground">
                      {selectedRegistration.passes?.length || 0}
                    </p>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      Valid till event ends
                    </span>
                  </div>
                </div>
              )}

              {/* Primary Attendee Pass & Scan Status Banner */}
              <div className="p-4 rounded-2xl bg-pink-500/5 border border-pink-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/25 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {selectedRegistration.primaryName}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/25">
                        Primary Registrant
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {primaryStats.hasScanned ? (
                        <>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25">
                            <Scan className="w-3 h-3" />
                            Scanned {primaryStats.scanCount} {primaryStats.scanCount === 1 ? "time" : "times"}
                          </span>
                          {primaryStats.extraScans > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                              +{primaryStats.extraScans} extra re-entries
                            </span>
                          )}
                          {primaryStats.latestCheckIn && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground/60" />
                              Last entry: {new Date(primaryStats.latestCheckIn.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                          0 Scans • Pass not used at gate yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {primaryPass && (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSelectedPassForQr({
                          token: primaryPass.token,
                          holderName: primaryPass.holderName,
                        })
                      }
                      className="rounded-xl text-xs font-semibold h-8.5 px-3 bg-card border-border hover:bg-muted cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 mr-1.5 text-pink-500" /> View QR
                    </Button>
                    <Link
                      href={`/p/${primaryPass.token}`}
                      target="_blank"
                      className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline px-2 py-1 flex items-center gap-1"
                    >
                      Pass <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Attendee Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-pink-500" /> Mobile Number
                  </span>
                  <div className="flex items-center justify-between">
                    <a
                      href={`tel:+91${selectedRegistration.mobileNumber}`}
                      className="text-xs sm:text-sm font-bold font-mono text-foreground hover:text-pink-600 transition-colors"
                    >
                      +91 {selectedRegistration.mobileNumber}
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(selectedRegistration.mobileNumber, "Mobile number")
                      }
                      className="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
                      title="Copy mobile number"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-500" /> City / Village
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-foreground">
                    {selectedRegistration.place}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1 sm:col-span-2 md:col-span-1">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Registered On
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    {new Date(selectedRegistration.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Family Members Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    Family Members Included
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                      {selectedRegistration.familyMembers?.length || 0}
                    </span>
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedRegistration.totalMembers} Total in Group (1 Primary +{" "}
                    {selectedRegistration.familyMembers?.length || 0} Family)
                  </span>
                </div>

                {!selectedRegistration.familyMembers ||
                  selectedRegistration.familyMembers.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 text-center">
                    <p className="text-xs text-muted-foreground">
                      Solo Attendee — No additional family members registered in this group.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {selectedRegistration.familyMembers.map((member) => {
                      const memberPass = getPassForMember(selectedRegistration.passes, member.name, false);
                      const mStats = getMemberScanStats(memberPass);

                      return (
                        <div
                          key={member.id}
                          className="p-3.5 rounded-2xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-pink-500/25 transition-all"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-xs font-bold text-foreground shrink-0 mt-0.5">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-xs sm:text-sm font-bold text-foreground truncate">
                                  {member.name}
                                </h5>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${getRelationBadgeColor(
                                    member.relation
                                  )}`}
                                >
                                  {member.relation}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                {mStats.hasScanned ? (
                                  <>
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25">
                                      <Scan className="w-2.5 h-2.5" />
                                      Scanned {mStats.scanCount} {mStats.scanCount === 1 ? "time" : "times"}
                                    </span>

                                    {mStats.extraScans > 0 && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                                        +{mStats.extraScans} extra scans
                                      </span>
                                    )}

                                    {mStats.latestCheckIn && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                                        Last entry: {new Date(mStats.latestCheckIn.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                                    0 Scans • Not entered yet
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {memberPass && (
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedPassForQr({
                                    token: memberPass.token,
                                    holderName: member.name,
                                  })
                                }
                                className="rounded-xl text-xs font-semibold h-8 px-2.5 bg-card border-border hover:bg-muted cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5 mr-1 text-pink-500" /> View QR
                              </Button>
                              <Link
                                href={`/p/${memberPass.token}`}
                                target="_blank"
                                className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline px-1.5 py-1 flex items-center gap-1"
                              >
                                Pass <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Gate Entry Passes Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-purple-500" />
                    Gate Entry Passes ({selectedRegistration.passes?.length || 0})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Passes valid until event ends
                  </span>
                </div>

                {!selectedRegistration.passes || selectedRegistration.passes.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 text-center">
                    <p className="text-xs text-muted-foreground">
                      No entry passes generated for this registration.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedRegistration.passes.map((pass) => {
                      const checkIns = pass.checkIns || [];
                      const scanCount = checkIns.length;
                      const extraCount = Math.max(0, scanCount - 1);
                      const isUsed = scanCount > 0;
                      const latestCheckIn = checkIns[0];

                      return (
                        <div
                          key={pass.id}
                          className="p-3.5 rounded-2xl bg-muted/25 border border-border space-y-2.5 hover:border-pink-500/30 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-xs sm:text-sm font-bold text-foreground truncate">
                                  {pass.holderName}
                                </h5>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isUsed
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                    : "bg-muted text-muted-foreground border-border"
                                    }`}
                                >
                                  {isUsed
                                    ? `✓ Scanned ${scanCount} ${scanCount === 1 ? "time" : "times"}`
                                    : "Not Scanned Yet"}
                                </span>

                                {extraCount > 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                    +{extraCount} extra re-entries
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-mono">
                                <span className="bg-muted px-2 py-0.5 rounded-md text-[10px]">
                                  {pass.token}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(pass.token, "Pass token")}
                                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Copy Token"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                {latestCheckIn && (
                                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-sans font-semibold">
                                    Last scanned at {new Date(latestCheckIn.scannedAt).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedPassForQr({
                                    token: pass.token,
                                    holderName: pass.holderName,
                                  })
                                }
                                className="rounded-xl text-xs font-semibold h-8.5 px-3 bg-card border-border hover:bg-muted cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5 mr-1.5 text-pink-500" />
                                View QR
                              </Button>

                              <Link
                                href={`/p/${pass.token}`}
                                target="_blank"
                                className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline px-2.5 py-1.5 flex items-center gap-1"
                              >
                                Pass Page <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>

                          {/* Multiple scan history trail if scanned more than once */}
                          {checkIns.length > 1 && (
                            <div className="pt-2 border-t border-border/50 space-y-1.5">
                              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                                <History className="w-3 h-3 text-purple-500" />
                                All Gate Entries ({checkIns.length})
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {checkIns.map((ci, idx) => (
                                  <span
                                    key={ci.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-background/80 text-foreground border border-border"
                                  >
                                    <span className="font-sans font-bold text-emerald-600 dark:text-emerald-400">
                                      Entry #{checkIns.length - idx}
                                    </span>
                                    {new Date(ci.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Inspection Modal */}
      <Dialog
        open={!!selectedPassForQr}
        onOpenChange={(open) => {
          if (!open) setSelectedPassForQr(null);
        }}
      >
        <DialogContent className="sm:max-w-xs rounded-3xl p-6 bg-card border-border shadow-2xl text-center">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              {selectedPassForQr?.holderName}&apos;s Entry Pass
            </DialogTitle>
          </DialogHeader>
          {selectedPassForQr && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-center">
                <QRCodeView
                  data={selectedPassForQr.token}
                  size={200}
                  showDownload={false}
                  fileName={`${selectedPassForQr.holderName}-pass`}
                  className="bg-white p-3 rounded-2xl shadow-inner"
                />
              </div>
              <div className="p-2.5 rounded-xl bg-muted/60 font-mono text-xs text-foreground select-all break-all">
                {selectedPassForQr.token}
              </div>
              <div className="flex items-center justify-center gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleCopyText(selectedPassForQr.token, "Token")}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </button>
                <span className="text-muted-foreground/30">•</span>
                <Link
                  href={`/p/${selectedPassForQr.token}`}
                  target="_blank"
                  className="text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
                >
                  Public Link <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border-border shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Delete Registration?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this attendee registration? This action will
              permanently remove the registration record, all associated family members, and their
              issued entry passes.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => confirmDeleteId && handleDeleteRegistration(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="rounded-xl text-xs font-bold h-9 px-4 bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
