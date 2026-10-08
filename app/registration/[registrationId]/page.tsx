import { getPublicRegistrationEventAction } from "@/actions/registration.actions";
import { getRegistrationAuth } from "@/lib/registration/session";
import { EventRegHeader } from "./components/event-reg-header";
import { MobileStepClient } from "./components/mobile-step-client";
import {
  AlertCircle,
  ShieldAlert,
  ShieldX,
  Flame,
  ArrowLeft,
  User,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface RegistrationPageProps {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{ unauthorized?: string }>;
}

export default async function PublicRegistrationPage({
  params,
  searchParams,
}: RegistrationPageProps) {
  const { registrationId } = await params;
  const { unauthorized } = await searchParams;

  // Check if user already has an active verified authentication cookie for this event
  const auth = await getRegistrationAuth(registrationId);

  // If user has active registration, redirect to success/pass view
  if (auth.isAuthenticated && auth.hasActiveRegistration && auth.registrationId) {
    redirect(`/registration/${registrationId}/success?id=${auth.registrationId}`);
  }

  // If user verified OTP earlier but hasn't submitted details yet:
  if (auth.isAuthenticated && auth.hasPendingSession) {
    redirect(`/registration/${registrationId}/form`);
  }

  const res = await getPublicRegistrationEventAction(registrationId);

  // Invalid Link View (Styled in royal crimson & gold)
  if (!res.success || !res.event) {
    return (
      <main className="min-h-screen bg-[#140104] text-amber-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[radial-gradient(circle_at_center,rgba(180,18,36,0.25)_0%,transparent_70%)] blur-3xl pointer-events-none" />

        <div className="max-w-md w-full p-8 rounded-3xl bg-gradient-to-b from-[#2e040b]/95 to-[#160205]/98 border-2 border-amber-500/40 shadow-2xl space-y-5 relative z-10 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg">
            <ShieldX className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-amber-100 font-serif">
              Invalid Registration Link
            </h1>
            <p className="text-xs text-amber-300/80 font-serif">
              અમાન્ય રજીસ્ટ્રેશન લિંક
            </p>
          </div>
          <p className="text-sm text-amber-200/75 leading-relaxed">
            The registration link <code className="text-amber-400 font-mono text-xs bg-black/40 px-2 py-0.5 rounded border border-amber-500/20">{registrationId}</code> is not valid or has been disabled by the event organizer.
          </p>
          <div className="pt-2">
            <Link
              href="/welcome"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-[#2a0408] font-black text-xs hover:from-amber-400 hover:to-yellow-500 shadow-lg shadow-amber-500/20 transition-all gap-2"
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
  const isFull = event.isFull;
  const isClosed = !event.registrationEnabled || event.status !== "ACTIVE";

  return (
    <main className="min-h-screen bg-[#140104] text-amber-50 relative selection:bg-amber-500 selection:text-black overflow-x-hidden font-sans">
      {/* Background Ambience & Festive Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top radial warm festive crimson burst */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[radial-gradient(circle_at_center,rgba(180,18,36,0.3)_0%,rgba(100,5,18,0.15)_50%,transparent_75%)] blur-3xl" />
        {/* Golden ambient glows */}
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.1)_0%,transparent_70%)] blur-3xl" />

        {/* Subtle traditional rangoli/mandala pattern watermark */}
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
            href="/welcome"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-200 hover:text-amber-300 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
              <ArrowLeft className="w-4 h-4 text-amber-400" />
            </div>
            <span>Back to Festival</span>
          </Link>

          {/* Festival Center Branding */}
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

          {/* Login Button */}
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-amber-200 hover:text-white bg-white/5 hover:bg-white/10 border border-amber-400/30 transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>Login</span>
          </Link>
        </div>
      </header>

      {/* Main Registration Form Container */}
      <div className="relative z-10 py-8 px-4 sm:px-6 flex flex-col items-center justify-start">
        <div className="w-full max-w-xl space-y-6">
          {/* Sacred Auspicious Heading Inscription */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wide backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>॥ શ્રી દ્વારકાધીશાય નમઃ ॥ જય બહુચર માઁ ॥</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
          </div>

          {/* Event Header Banner */}
          <EventRegHeader event={event} />

          {/* Security warning if unauthorized attempt occurred */}
          {unauthorized && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-3 text-rose-200 backdrop-blur-md shadow-lg">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div className="text-sm">
                <p className="font-bold text-rose-100">Pass Protected</p>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  For security reasons, pass details can only be viewed by the verified ticket holder. Please enter your registered mobile number and verify via OTP.
                </p>
              </div>
            </div>
          )}

          {/* Alerts for Closed or Full events */}
          {isClosed ? (
            <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-start gap-3 text-amber-200 backdrop-blur-md shadow-lg">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
              <div className="text-sm">
                <p className="font-bold text-amber-100">Public Registration is Closed</p>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  New registrations are currently closed. If you already registered, enter your mobile number below to verify and retrieve your pass.
                </p>
              </div>
            </div>
          ) : isFull ? (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-3 text-rose-200 backdrop-blur-md shadow-lg">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div className="text-sm">
                <p className="font-bold text-rose-100">Event Capacity Reached</p>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  All spots are currently filled. If you have already registered, enter your mobile number below to verify and view your pass.
                </p>
              </div>
            </div>
          ) : null}

          {/* Mobile Step Client */}
          <MobileStepClient registrationId={registrationId} event={event} />

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
