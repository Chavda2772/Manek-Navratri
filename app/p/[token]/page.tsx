import { Metadata } from "next";
import { getPassByTokenAction } from "@/actions/event.actions";
import { ShieldX, TicketX, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PublicPassClient } from "./components/public-pass-client";

export const dynamic = "force-dynamic";

interface PublicPassPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PublicPassPageProps): Promise<Metadata> {
  const { token } = await params;
  const res = await getPassByTokenAction(token);

  if (!res.success || !res.pass) {
    return {
      title: "Event Pass | EventKey",
      description: "Digital entry pass verification.",
    };
  }

  const pass = res.pass;
  const event = pass.event;
  const attendeeName = pass.holderName || "Attendee";
  const eventTitle = event?.title || "Special Event";

  return {
    title: `${attendeeName} - Entry Pass | ${eventTitle}`,
    description: `Official digital event pass for ${attendeeName} at ${eventTitle}. Present this pass at the entrance gate for quick QR scan admission.`,
    openGraph: {
      title: `${attendeeName} • Event Pass`,
      description: `Official digital entry pass for ${eventTitle}. Present QR code at the gate.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${attendeeName} • Entry Pass | ${eventTitle}`,
      description: `Digital entry pass for ${eventTitle}.`,
    },
  };
}

export default async function PublicPassPage({ params }: PublicPassPageProps) {
  const { token } = await params;
  const res = await getPassByTokenAction(token);

  if (!res.success || !res.pass) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
        {/* Ambient glow */}
        <div className="absolute w-80 h-80 rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl flex flex-col items-center space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10">
            <TicketX className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Invalid Pass Token</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Pass Not Found or Revoked</p>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
            We couldn’t find an active event pass matching <code className="text-pink-400 font-mono bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 break-all">{token}</code>. Please check your link or contact the event organizers.
          </p>

          <div className="pt-2 w-full">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-98 text-white font-bold text-xs rounded-xl border border-zinc-700 shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Return to EventKey Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { pass } = res;
  const event = pass.event;

  const eventDateFormatted = event?.startDate
    ? new Date(event.startDate).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "Event Date";

  const eventTimeFormatted = event?.startDate
    ? new Date(event.startDate).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    : "";

  return (
    <PublicPassClient
      pass={pass}
      event={event}
      eventDateFormatted={eventDateFormatted}
      eventTimeFormatted={eventTimeFormatted}
    />
  );
}
