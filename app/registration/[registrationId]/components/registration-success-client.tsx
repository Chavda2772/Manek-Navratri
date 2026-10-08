"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearRegistrationSessionAction } from "@/actions/registration.actions";
import {
  CheckCircle2,
  MapPin,
  Sparkles,
  Ticket,
  Users,
  ExternalLink,
  Phone,
  LogOut,
  Loader2,
  Flame,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
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

  const familyMembers = registration.familyMembers || [];
  const passes: any[] = registration.passes || [];

  // Group attendees with their matching pass
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
    <div className="space-y-6 text-amber-50">
      {/* ALREADY REGISTERED BANNER */}
      {isAlreadyRegistered && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-[#220409] border-2 border-amber-500/40 shadow-lg flex items-start gap-3.5 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-[#2a0408] flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 mt-0.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-amber-100 text-base font-serif">
                Pass Already Issued
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black border border-amber-500/40">
                1 PASS PER MOBILE
              </span>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Mobile number <strong className="font-mono text-amber-100">+91 {registration.mobileNumber}</strong> is already registered for Manek Navratri. Below is your official entry pass and QR codes.
            </p>
          </div>
        </div>
      )}

      {/* CONFIRMATION HERO */}
      <div className="text-center space-y-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#2e040b]/95 via-[#210308]/95 to-[#160205]/98 border-2 border-amber-500/40 shadow-[0_10px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden">
        {/* Corner Ornaments */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 text-[#2a0408] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            {isAlreadyRegistered ? "માણેક નવરાત્રી પાસ કન્ફર્મ" : "Registration Confirmed"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-400 font-serif">
            Welcome, {registration.primaryName}!
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/80 max-w-md mx-auto">
            Show the QR code at the event gate on your mobile to enter.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Total: {registration.totalMembers} Attendees</span>
          </span>
          {registration.place && (
            <span className="px-3 py-1 rounded-full bg-black/40 text-amber-200 text-xs font-medium border border-amber-500/30 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" /> {registration.place}
            </span>
          )}
        </div>
      </div>

      {/* REGISTERED ATTENDEES BREAKDOWN SECTION */}
      <div className="rounded-3xl bg-gradient-to-b from-[#2e040b]/95 via-[#210308]/95 to-[#160205]/98 border-2 border-amber-500/40 p-5 sm:p-7 shadow-xl backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-amber-100 font-serif">
              Registered Attendees &amp; Passes
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
            {registration.totalMembers} Confirmed
          </span>
        </div>

        <div className="space-y-4 text-sm">
          {/* Primary Attendee Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Primary Attendee
              </span>
              <span className="text-xs font-mono font-bold text-amber-200">
                +91 {registration.mobileNumber}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-100 font-bold text-base">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{registration.primaryName}</span>
                </div>
                {registration.place && (
                  <p className="text-xs text-amber-200/70 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> Place: {registration.place}
                  </p>
                )}
              </div>

              {primaryPass && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/p/${primaryPass.token}`}
                    target="_blank"
                    className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-[#2a0408] shadow-md inline-flex items-center gap-1.5 transition-all"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>View Pass &amp; QR</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Family Members Breakdown */}
          {familyMembers.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                Family Members ({familyMembers.length})
              </span>
              <div className="space-y-2">
                {memberPassMap.map(({ member, pass }: MemberPassItem, idx: number) => (
                  <div
                    key={member.id || idx}
                    className="p-3.5 rounded-xl bg-black/30 border border-amber-500/20 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-amber-100 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{member.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          {member.relation}
                        </span>
                      </div>
                      {pass && (
                        <p className="text-[11px] font-mono text-amber-200/60">
                          {pass.checkIns && pass.checkIns.length > 0 && (
                            <span className="ml-2 text-amber-400 font-bold">
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
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 inline-flex items-center gap-1 transition-colors"
                        >
                          <span>View Pass</span>
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
          <div className="pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSwitchNumber}
              disabled={switching}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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

            <Link
              href="/welcome"
              className="text-xs font-bold text-amber-300 hover:underline inline-flex items-center gap-1"
            >
              <span>Back to Festival Home</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
