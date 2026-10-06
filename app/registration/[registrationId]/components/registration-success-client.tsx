"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeView } from "@/components/qr-code-view";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Sparkles,
  Ticket,
  Users,
  ExternalLink,
  Phone,
  Share2,
  QrCode,
  Layers,
  ArrowRight,
  Info,
  Check,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RegistrationSuccessClientProps {
  registrationId: string;
  registration: any;
}

export function RegistrationSuccessClient({
  registrationId,
  registration,
}: RegistrationSuccessClientProps) {
  const searchParams = useSearchParams();
  const isAlreadyRegistered = searchParams.get("alreadyRegistered") === "true";

  const event = registration.event;
  const familyMembers = registration.familyMembers || [];
  const passes: any[] = registration.passes || [];

  // Group attendees with their matching pass
  // Primary pass is passes[0] or matching primaryName
  const primaryPass =
    passes.find(
      (p) =>
        p.holderName?.toLowerCase().trim() ===
        registration.primaryName?.toLowerCase().trim()
    ) || passes[0];

  interface MemberPassItem {
    member: any;
    pass: any;
  }

  // Map each family member to their generated pass
  const memberPassMap: MemberPassItem[] = familyMembers.map((m: any, idx: number) => {
    const matchingPass =
      passes.find(
        (p) =>
          p.id !== primaryPass?.id &&
          p.holderName?.toLowerCase().trim() === m.name?.toLowerCase().trim()
      ) ||
      passes.filter((p) => p.id !== primaryPass?.id)[idx];

    return {
      member: m,
      pass: matchingPass,
    };
  });

  // All pass holders for switcher tabs
  const allPassHolders = [
    {
      id: primaryPass?.id || "primary",
      holderName: registration.primaryName,
      relation: "Primary Attendee",
      isPrimary: true,
      pass: primaryPass,
    },
    ...memberPassMap.map(({ member, pass }: MemberPassItem, idx: number) => ({
      id: pass?.id || member.id || `member_${idx}`,
      holderName: member.name,
      relation: member.relation,
      isPrimary: false,
      pass,
    })),
  ];

  const [selectedPassIndex, setSelectedPassIndex] = useState(0);
  const [viewAllQrs, setViewAllQrs] = useState(false);

  const activePassHolder = allPassHolders[selectedPassIndex] || allPassHolders[0];
  const activePass = activePassHolder?.pass || primaryPass;

  const startDateFormatted = event?.startDate
    ? new Date(event.startDate).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const handleShare = async () => {
    const shareUrl = activePass
      ? `${window.location.origin}/p/${activePass.token}`
      : window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event?.title || "Event"} - Pass for ${activePassHolder?.holderName}`,
          text: `Entry pass for ${activePassHolder?.holderName} (${event?.title}). Reference: ${registration.id}`,
          url: shareUrl,
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Pass link copied to clipboard!");
    }
  };

  const scrollToQRSection = (index: number) => {
    setSelectedPassIndex(index);
    setViewAllQrs(false);
    const element = document.getElementById("qr-pass-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6">
      {/* ALREADY REGISTERED BANNER */}
      {isAlreadyRegistered && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-card border-2 border-emerald-500/40 shadow-md flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 mt-0.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-foreground text-base">
                Pass Already Issued
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-black border border-emerald-500/30">
                1 PASS PER MOBILE
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mobile number <strong className="font-mono text-foreground">+91 {registration.mobileNumber}</strong> is already registered for this event. Each mobile number can only register once. Below is your official entry pass, QR codes for all group members, and registration details.
            </p>
          </div>
        </div>
      )}

      {/* CONFIRMATION HERO */}
      <div className="text-center space-y-3 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-card border border-emerald-500/30 shadow-xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            {isAlreadyRegistered ? "Existing Registration" : "Registration Confirmed"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            {isAlreadyRegistered
              ? `Welcome Back, ${registration.primaryName}!`
              : `You're All Set for ${event?.title || "the Event"}!`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            {isAlreadyRegistered
              ? "Here are the entry pass and QR codes generated for you and your family."
              : "Your registration is confirmed. Please present the QR code below at the event gate."}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-muted text-foreground text-xs font-mono font-bold border">
            Ref: {registration.id}
          </span>
          <span className="px-3 py-1 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400 text-xs font-bold border border-pink-500/20">
            Total: {registration.totalMembers} People
          </span>
          {registration.place && (
            <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium border flex items-center gap-1">
              <MapPin className="w-3 h-3 text-pink-500" /> {registration.place}
            </span>
          )}
        </div>
      </div>

      {/* DIGITAL ENTRY PASS & QR VIEWER */}
      <div
        id="qr-pass-section"
        className="rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 sm:p-8 border border-pink-500/30 shadow-2xl space-y-6 scroll-mt-6"
      >
        {/* Pass Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" /> Official Digital Entry Pass
            </span>
            <h2 className="text-xl font-bold text-white">{event?.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
              {startDateFormatted && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-pink-400" /> {startDateFormatted}
                </span>
              )}
              {event?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" /> {event.location}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold border-zinc-700 bg-zinc-800/80 text-white hover:bg-zinc-700 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 mr-1" /> Share
            </Button>
            {activePass && (
              <Link
                href={`/p/${activePass.token}`}
                target="_blank"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white inline-flex items-center gap-1 transition-colors"
              >
                Full Pass <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* MULTI-PASS MEMBER SELECTOR TABS (If group has more than 1 member) */}
        {allPassHolders.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold flex items-center gap-1.5 text-zinc-300">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                Select Member to View Their QR Code ({allPassHolders.length} Passes):
              </span>
              <button
                type="button"
                onClick={() => setViewAllQrs(!viewAllQrs)}
                className="font-bold text-pink-400 hover:text-pink-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Layers className="w-3 h-3" />
                {viewAllQrs ? "Switch to Tab View" : "View All QR Codes"}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {allPassHolders.map((holder, idx) => {
                const isSelected = selectedPassIndex === idx && !viewAllQrs;
                const scanCount = holder.pass?.checkIns?.length || 0;

                return (
                  <button
                    key={holder.id}
                    type="button"
                    onClick={() => {
                      setSelectedPassIndex(idx);
                      setViewAllQrs(false);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30 border border-pink-400"
                        : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700"
                    }`}
                  >
                    <span>{holder.holderName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                        isSelected
                          ? "bg-pink-700/80 text-white"
                          : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {holder.relation}
                    </span>
                    {scanCount > 0 && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        {scanCount}s
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 1: SINGLE SELECTED QR CODE VIEW */}
        {!viewAllQrs && activePass && (
          <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-zinc-950 rounded-2xl border border-zinc-800/80 space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 inline-block">
                {activePassHolder.relation}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {activePassHolder.holderName}
              </h3>
            </div>

            <QRCodeView
              data={activePass.token}
              size={220}
              showDownload={true}
              fileName={`${event?.title || "pass"}-${activePassHolder.holderName}`}
              className="bg-zinc-900 border-zinc-800 text-white"
            />

            <div className="text-center space-y-1 pt-1">
              <p className="text-xs font-mono text-zinc-400 tracking-wider">
                Token: <span className="text-pink-300 font-bold">{activePass.token}</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Pass Active
                </span>
                {activePass.checkIns && activePass.checkIns.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-[11px] font-mono border border-pink-500/30">
                    Scanned {activePass.checkIns.length} time(s)
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-400">
                    Ready for gate scan
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ALL QR CODES GRID VIEW (For quick group entry at gate) */}
        {viewAllQrs && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs text-pink-300 flex items-center justify-between">
              <span>Showing QR codes for all {allPassHolders.length} attendees:</span>
              <button
                type="button"
                onClick={() => setViewAllQrs(false)}
                className="font-bold underline hover:text-white cursor-pointer"
              >
                Back to Single View
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allPassHolders.map((holder, idx) => {
                if (!holder.pass) return null;
                return (
                  <div
                    key={holder.id}
                    className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center text-center space-y-3"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                        {holder.relation}
                      </span>
                      <h4 className="font-bold text-white text-base">
                        {holder.holderName}
                      </h4>
                    </div>

                    <QRCodeView
                      data={holder.pass.token}
                      size={170}
                      showDownload={true}
                      fileName={`${event?.title || "pass"}-${holder.holderName}`}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />

                    <p className="text-[11px] font-mono text-zinc-400">
                      {holder.pass.token}
                    </p>

                    <Link
                      href={`/p/${holder.pass.token}`}
                      target="_blank"
                      className="text-xs text-pink-400 hover:text-pink-300 font-bold inline-flex items-center gap-1"
                    >
                      Open Pass Page <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* REGISTERED ATTENDEES BREAKDOWN SECTION */}
      <div className="rounded-3xl bg-card border border-border/80 p-5 sm:p-7 shadow-lg space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-500" />
            <h3 className="text-base font-bold text-foreground">
              Registered Attendees Breakdown
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {registration.totalMembers} Confirmed
          </span>
        </div>

        <div className="space-y-4 text-sm">
          {/* Primary Attendee Card */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                Primary Attendee
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                +91 {registration.mobileNumber}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-foreground font-bold text-base">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{registration.primaryName}</span>
                </div>
                {registration.place && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-pink-500" /> Place: {registration.place}
                  </p>
                )}
                {primaryPass && (
                  <p className="text-xs font-mono text-muted-foreground">
                    Pass Token: <span className="text-foreground">{primaryPass.token}</span>
                  </p>
                )}
              </div>

              {primaryPass && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => scrollToQRSection(0)}
                    className="rounded-xl text-xs font-bold border-pink-500/30 text-pink-600 dark:text-pink-400 hover:bg-pink-500/10 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 mr-1" /> View QR
                  </Button>
                  <Link
                    href={`/p/${primaryPass.token}`}
                    target="_blank"
                    className="p-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground border inline-flex items-center transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Family Members Breakdown */}
          {familyMembers.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                Accompanying Family Members ({familyMembers.length})
              </span>
              <div className="space-y-2">
                {memberPassMap.map(({ member, pass }: MemberPassItem, idx: number) => (
                  <div
                    key={member.id || idx}
                    className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{member.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                          {member.relation}
                        </span>
                      </div>
                      {pass && (
                        <p className="text-[11px] font-mono text-muted-foreground">
                          Pass: <span className="text-foreground">{pass.token}</span>
                          {pass.checkIns && pass.checkIns.length > 0 && (
                            <span className="ml-2 text-pink-600 dark:text-pink-400 font-bold">
                              ({pass.checkIns.length} scan{pass.checkIns.length > 1 ? "s" : ""})
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {pass && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => scrollToQRSection(idx + 1)}
                          className="rounded-xl text-xs font-bold text-pink-600 dark:text-pink-400 hover:bg-pink-500/10 cursor-pointer h-8 px-2.5"
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1" /> View QR
                        </Button>
                        <Link
                          href={`/p/${pass.token}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-foreground border inline-flex items-center transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Mobile Rule Explanation & Registration Link */}
          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              1 Registration per Mobile Number Rule active
            </span>
            <Link
              href={`/registration/${registrationId}`}
              className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-1"
            >
              Check another mobile number <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

