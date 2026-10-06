"use client";

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
  const event = registration.event;
  const familyMembers = registration.familyMembers || [];
  const passes = registration.passes || [];
  const primaryPass = passes[0];

  const startDateFormatted = event?.startDate
    ? new Date(event.startDate).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.title} - Event Pass`,
          text: `My registration for ${event.title} is confirmed! Reference: ${registration.id}`,
          url: primaryPass ? `${window.location.origin}/p/${primaryPass.token}` : window.location.href,
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      await navigator.clipboard.writeText(
        primaryPass ? `${window.location.origin}/p/${primaryPass.token}` : window.location.href
      );
      toast.success("Pass link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      {/* CONFIRMATION HERO */}
      <div className="text-center space-y-3 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-card border border-emerald-500/30 shadow-xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Registration Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            You're All Set for {event.title}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Your registration has been successfully recorded. Please show the QR code below at the venue entrance.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-muted text-foreground text-xs font-mono font-bold border">
            Ref: {registration.id}
          </span>
          <span className="px-3 py-1 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400 text-xs font-bold border border-pink-500/20">
            Total: {registration.totalMembers} People
          </span>
        </div>
      </div>

      {/* DIGITAL ENTRY PASS WITH QR CODE */}
      {primaryPass && (
        <div className="rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 sm:p-8 border border-pink-500/30 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" /> Official Entry Pass
              </span>
              <h2 className="text-xl font-bold text-white">{event.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-pink-400" /> {startDateFormatted}
                </span>
                {event.location && (
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
                <Share2 className="w-3.5 h-3.5 mr-1" /> Share Pass
              </Button>
              <Link
                href={`/p/${primaryPass.token}`}
                target="_blank"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white inline-flex items-center gap-1 transition-colors"
              >
                Full Pass <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-2xl border border-zinc-800/80">
            <QRCodeView
              data={primaryPass.token}
              size={220}
              showDownload={true}
              fileName={`${event.title}-${registration.primaryName}-pass`}
              className="bg-zinc-900 border-zinc-800 text-white"
            />
            <p className="mt-3 text-xs font-mono text-zinc-400 tracking-wider">
              Token: {primaryPass.token}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 text-center">
              Scan this QR code at the event gate scanner for entry
            </p>
          </div>
        </div>
      )}

      {/* ATTENDEE DETAILS BREAKDOWN (Requested in prompt) */}
      <div className="rounded-3xl bg-card border border-border/80 p-5 sm:p-7 shadow-lg space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-500" />
            <h3 className="text-base font-bold text-foreground">
              Registered Attendees Breakdown
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Verified
          </span>
        </div>

        <div className="space-y-4 text-sm">
          {/* Primary */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                Primary Attendee
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                +91 {registration.mobileNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{registration.primaryName}</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Place: {registration.place}
            </p>
          </div>

          {/* Family */}
          {familyMembers.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Family Members ({familyMembers.length})
              </span>
              <div className="space-y-2">
                {familyMembers.map((m: any, i: number) => (
                  <div
                    key={m.id || i}
                    className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{m.name}</span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                      {m.relation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total summary */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-base font-black text-foreground">
              Total: {registration.totalMembers} People
            </span>
            <Link
              href={`/registration/${registrationId}`}
              className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline"
            >
              Register Another Attendee &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
