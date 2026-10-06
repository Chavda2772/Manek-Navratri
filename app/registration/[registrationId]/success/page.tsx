import { getRegistrationConfirmationAction } from "@/actions/registration.actions";
import { RegistrationSuccessClient } from "../components/registration-success-client";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{ id?: string }>;
}

export default async function PublicRegistrationSuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { registrationId } = await params;
  const { id } = await searchParams;

  if (!id) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
            <ShieldX className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Registration ID Missing</h1>
          <p className="text-sm text-muted-foreground">
            No registration record was specified.
          </p>
          <div className="pt-2">
            <Link
              href={`/registration/${registrationId}`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-pink-600 text-white font-bold text-xs hover:bg-pink-500 transition-colors"
            >
              Go to Registration
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const res = await getRegistrationConfirmationAction(id);

  if (!res.success || !res.registration) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
            <ShieldX className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Registration Not Found</h1>
          <p className="text-sm text-muted-foreground">
            The registration reference <code className="text-pink-500 font-mono">{id}</code> could not be found.
          </p>
          <div className="pt-2">
            <Link
              href={`/registration/${registrationId}`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-pink-600 text-white font-bold text-xs hover:bg-pink-500 transition-colors"
            >
              Start New Registration
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 flex flex-col items-center justify-start">
      <div className="w-full max-w-2xl space-y-6">
        <RegistrationSuccessClient
          registrationId={registrationId}
          registration={res.registration}
        />
      </div>
    </main>
  );
}
