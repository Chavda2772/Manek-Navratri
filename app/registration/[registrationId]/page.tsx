import { getPublicRegistrationEventAction } from "@/actions/registration.actions";
import { getRegistrationAuth } from "@/lib/registration/session";
import { EventRegHeader } from "./components/event-reg-header";
import { MobileStepClient } from "./components/mobile-step-client";
import { AlertCircle, ShieldAlert, ShieldX } from "lucide-react";
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

  // Requirement 3: next visit use that cookie to auth user
  if (auth.isAuthenticated && auth.hasActiveRegistration && auth.registrationId) {
    redirect(`/registration/${registrationId}/success?id=${auth.registrationId}`);
  }

  // If user verified OTP earlier but hasn't submitted details yet:
  if (auth.isAuthenticated && auth.hasPendingSession) {
    redirect(`/registration/${registrationId}/form`);
  }

  const res = await getPublicRegistrationEventAction(registrationId);

  if (!res.success || !res.event) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
            <ShieldX className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-foreground">
            Invalid Registration Link
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The registration link <code className="text-pink-500 font-mono text-xs">{registrationId}</code> is not valid or has been disabled by the event organizer.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold text-xs hover:bg-secondary/80 transition-colors"
            >
              Return to Home
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
    <main className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 flex flex-col items-center justify-start">
      <div className="w-full max-w-xl space-y-6">
        {/* Security warning if unauthorized attempt occurred */}
        {unauthorized && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-700 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Pass Protected</p>
              <p className="text-xs opacity-90 mt-0.5">
                For security reasons, pass details can only be viewed by the verified ticket holder. Please enter your registered mobile number and verify via OTP.
              </p>
            </div>
          </div>
        )}

        {/* Alerts for Closed or Full events */}
        {isClosed ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Public Registration is Closed</p>
              <p className="text-xs opacity-90 mt-0.5">
                New registrations are closed. If you already registered, enter your mobile number below to verify and retrieve your pass.
              </p>
            </div>
          </div>
        ) : isFull ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Event Capacity Reached</p>
              <p className="text-xs opacity-90 mt-0.5">
                All spots are currently filled. If you have already registered, enter your mobile number below to verify and view your pass.
              </p>
            </div>
          </div>
        ) : null}

        <MobileStepClient registrationId={registrationId} event={event} />
      </div>
    </main>
  );
}
