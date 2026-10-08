import { Metadata } from "next";
import { getPassByTokenAction } from "@/actions/event.actions";
import { TicketX, ArrowLeft, Flame, Sparkles } from "lucide-react";
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
      title: "Event Pass | Manek Navratri 2026",
      description: "Digital entry pass verification for Manek Navratri.",
    };
  }

  const pass = res.pass;
  const event = pass.event;
  const attendeeName = pass.holderName || "Attendee";
  const eventTitle = event?.title || "Manek Navratri 2026";

  return {
    title: `${attendeeName} - Digital Pass | Manek Navratri 2026`,
    description: `Official digital entry pass for ${attendeeName} at ${eventTitle}, Devbhumi Dwarka. Present this QR code at the entrance gate.`,
    openGraph: {
      title: `${attendeeName} • Manek Navratri Pass`,
      description: `Official digital entry pass for ${eventTitle}. Present QR code at the entrance gate.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${attendeeName} • Manek Navratri Pass`,
      description: `Digital entry pass for ${eventTitle}.`,
    },
  };
}

export default async function PublicPassPage({ params }: PublicPassPageProps) {
  const { token } = await params;
  const res = await getPassByTokenAction(token);

  if (!res.success || !res.pass) {
    return (
      <div className="min-h-screen bg-[#140104] text-amber-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[radial-gradient(circle_at_center,rgba(180,18,36,0.3)_0%,transparent_70%)] blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-gradient-to-b from-[#2e040b]/95 to-[#160205]/98 border-2 border-amber-500/40 shadow-2xl backdrop-blur-xl flex flex-col items-center space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10">
            <TicketX className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-amber-100 font-serif tracking-tight">Invalid Pass Token</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">અમાન્ય પાસ અથવા રદ થયેલ પાસ</p>
          </div>

          <p className="text-xs text-amber-200/75 leading-relaxed max-w-sm">
            We couldn&apos;t find an active event pass matching <code className="text-amber-400 font-mono bg-black/40 px-2 py-0.5 rounded border border-amber-500/20 break-all">{token}</code>. Please verify your link or register for a new pass.
          </p>

          <div className="pt-2 w-full space-y-2">
            <Link
              href="/welcome"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-[#2a0408] font-black text-xs rounded-xl shadow-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Manek Navratri
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { pass } = res;
  const event = pass.event;

  const eventDateFormatted = event?.startDate
    ? new Date(event.startDate).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "11 Oct 2026";

  const eventTimeFormatted = event?.startDate
    ? new Date(event.startDate).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "9:00 PM";

  return (
    <PublicPassClient
      pass={pass}
      event={event}
      eventDateFormatted={eventDateFormatted}
      eventTimeFormatted={eventTimeFormatted}
    />
  );
}
