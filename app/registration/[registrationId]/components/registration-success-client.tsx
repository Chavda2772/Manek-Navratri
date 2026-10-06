"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearRegistrationSessionAction } from "@/actions/registration.actions";
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
  LogOut,
  Loader2,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [switching, setSwitching] = useState(false);
  const isAlreadyRegistered = searchParams.get("alreadyRegistered") === "true";

  const handleSwitchNumber = async () => {
    setSwitching(true);
    try {
      await clearRegistrationSessionAction(registrationId);
      router.push(`/registration/${registrationId}`);
    } catch {
      router.push(`/registration/${registrationId}`);
    } finally {
      setSwitching(false);
    }
  };

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
            {`Welcome, ${registration.primaryName}!`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Show the QR code at the event gate.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
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

      {/* REGISTERED ATTENDEES BREAKDOWN SECTION */}
      <div className="rounded-3xl bg-card border border-border/80 p-5 sm:p-7 shadow-lg space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-500" />
            <h3 className="text-base font-bold text-foreground">
              Registered Attendees
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
              </div>

              {primaryPass && (
                <div className="flex items-center gap-2">
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
                Family Members ({familyMembers.length})
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
            <button
              type="button"
              onClick={handleSwitchNumber}
              disabled={switching}
              className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {switching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Switching...
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" /> Check another mobile number
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

