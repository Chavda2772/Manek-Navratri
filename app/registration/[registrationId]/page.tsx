import { getPublicRegistrationEventAction } from "@/actions/registration.actions";
import { EventRegHeader } from "./components/event-reg-header";
import { MobileStepClient } from "./components/mobile-step-client";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface RegistrationPageProps {
  params: Promise<{ registrationId: string }>;
}

export default async function PublicRegistrationPage({ params }: RegistrationPageProps) {
  const { registrationId } = await params;
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

  return (
    <main className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 flex flex-col items-center justify-start">
      <div className="w-full max-w-xl space-y-6">
        <EventRegHeader event={event} currentStep={1} />
        <MobileStepClient registrationId={registrationId} event={event} />
      </div>
    </main>
  );
}
