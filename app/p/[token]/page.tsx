import { getPassByTokenAction } from "@/actions/event.actions";
import { ShieldX } from "lucide-react";
import Link from "next/link";
import { PublicPassClient } from "./components/public-pass-client";

export const dynamic = "force-dynamic";

interface PublicPassPageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicPassPage({ params }: PublicPassPageProps) {
  const { token } = await params;
  const res = await getPassByTokenAction(token);

  if (!res.success || !res.pass) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
          <ShieldX className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Invalid Event Pass Token</h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          The pass token <code className="text-pink-400 font-mono">{token}</code> could not be found or has been revoked.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm rounded-xl border border-zinc-800"
        >
          Return to EventKey Home
        </Link>
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

  return (
    <PublicPassClient
      pass={pass}
      event={event}
      eventDateFormatted={eventDateFormatted}
    />
  );
}
