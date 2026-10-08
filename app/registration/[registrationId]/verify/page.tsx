import {
  getPublicRegistrationEventAction,
  getRegistrationOtpStatusAction,
} from "@/actions/registration.actions";
import { getRegistrationAuth } from "@/lib/registration/session";
import { EventRegHeader } from "../components/event-reg-header";
import { VerifyStepClient } from "../components/verify-step-client";
import { ShieldX, Flame, ArrowLeft, User, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface VerifyPageProps {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{ phone?: string }>;
}

export default async function PublicRegistrationVerifyPage({
  params,
  searchParams,
}: VerifyPageProps) {
  const { registrationId } = await params;
  const { phone } = await searchParams;

  // If user already authenticated via cookie, jump directly to their pass or details form
  const auth = await getRegistrationAuth(registrationId);

  if (auth.isAuthenticated && auth.hasActiveRegistration && auth.registrationId) {
    redirect(
      `/registration/${registrationId}/success?id=${auth.registrationId}&alreadyRegistered=true`
    );
  }

  if (auth.isAuthenticated && auth.hasPendingSession) {
    redirect(`/registration/${registrationId}/form`);
  }

  // If no phone parameter provided, redirect back to enter mobile
  if (!phone) {
    redirect(`/registration/${registrationId}`);
  }

  const [res, otpStatusRes] = await Promise.all([
    getPublicRegistrationEventAction(registrationId),
    getRegistrationOtpStatusAction({
      registrationId,
      mobileNumber: phone,
    }),
  ]);

  if (!res.success || !res.event) {
    return (
      <main className="min-h-screen bg-[#140104] text-amber-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-hidden">
        <div className="max-w-md w-full p-8 rounded-3xl bg-gradient-to-b from-[#2e040b]/95 to-[#160205]/98 border-2 border-amber-500/40 shadow-2xl space-y-5 relative z-10 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg">
            <ShieldX className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-amber-100 font-serif">
            Invalid Registration Link
          </h1>
          <p className="text-sm text-amber-200/75 leading-relaxed">
            The registration link <code className="text-amber-400 font-mono text-xs bg-black/40 px-2 py-0.5 rounded border border-amber-500/20">{registrationId}</code> is not valid or has been disabled.
          </p>
          <div className="pt-2">
            <Link
              href="/welcome"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-[#2a0408] font-black text-xs hover:from-amber-400 hover:to-yellow-500 shadow-lg transition-all gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Manek Navratri</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { event } = res;
  const initialOtpStatus = otpStatusRes.success ? otpStatusRes : undefined;

  return (
    <main className="min-h-screen bg-[#140104] text-amber-50 relative selection:bg-amber-500 selection:text-black overflow-x-hidden font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[radial-gradient(circle_at_center,rgba(180,18,36,0.3)_0%,rgba(100,5,18,0.15)_50%,transparent_75%)] blur-3xl" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12)_0%,transparent_70%)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035] bg-repeat"
          style={{
            backgroundImage: `radial-gradient(#fbbf24 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#1b0206]/85 border-b border-amber-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link
            href={`/registration/${registrationId}`}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-200 hover:text-amber-300 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
              <ArrowLeft className="w-4 h-4 text-amber-400" />
            </div>
            <span>Change Number</span>
          </Link>

          <Link href="/welcome" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-200 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <div className="w-full h-full rounded-full bg-[#290308] flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 font-serif">
                માણેક નવરાત્રી
              </span>
              <span className="text-[10px] text-amber-200/70 uppercase tracking-widest font-semibold">
                Devbhumi Dwarka
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-amber-200 hover:text-white bg-white/5 hover:bg-white/10 border border-amber-400/30 transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>Login</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 py-8 px-4 sm:px-6 flex flex-col items-center justify-start">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wide backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>॥ શ્રી દ્વારકાધીશાય નમઃ ॥ જય બહુચર માઁ ॥</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
          </div>

          <EventRegHeader event={event} currentStep={2} />

          <VerifyStepClient
            registrationId={registrationId}
            event={event}
            initialPhone={phone}
            initialOtpStatus={initialOtpStatus}
          />

          {/* Festival Highlights Footer Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#250409]/90 to-[#170205]/95 border border-amber-500/30 text-center space-y-2 backdrop-blur-md">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              મુખ્ય આયોજક અને પ્રેરક
            </div>
            <div className="text-sm font-bold text-amber-100">
              શ્રી પબુભા માણેક (MLA દ્વારકા) &amp; શ્રી સહદેવ માણેક
            </div>
            <div className="text-xs text-amber-200/70 pt-1">
              સ્થળ: માણેક નવરાત્રી ગ્રાઉન્ડ, દેવભૂમિ દ્વારકા • શુભારંભ: 11 ઑક્ટોબર 2026, રાત્રે 9:00 PM
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
