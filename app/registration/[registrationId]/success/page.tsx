import { getRegistrationConfirmationAction } from "@/actions/registration.actions";
import { getRegistrationAuth } from "@/lib/registration/session";
import { auth as betterAuth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { hasAnyRole } from "@/lib/auth/permissions";
import { UserRole } from "@/lib/generated/prisma/enums";
import { RegistrationSuccessClient } from "../components/registration-success-client";
import { ShieldX } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  // 1. Check user authentication cookie for this event
  const auth = await getRegistrationAuth(registrationId);

  // If no target id is passed, but user has active registration in cookie, redirect to their registration id
  if (!id) {
    if (auth.isAuthenticated && auth.hasActiveRegistration && auth.registrationId) {
      redirect(`/registration/${registrationId}/success?id=${auth.registrationId}`);
    }
    // If not authenticated and no ID, redirect to enter mobile
    redirect(`/registration/${registrationId}`);
  }

  // 2. Load the registration record details
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

  // 3. SECURITY AUTHENTICATION VERIFICATION:
  // Prevent unauthorized visitors from watching other users' activated passes!
  let isModerator = false;
  try {
    const userSession = await betterAuth.api.getSession({
      headers: await headers(),
    });
    if (userSession?.user) {
      isModerator = hasAnyRole(userSession.user.role, [UserRole.admin, UserRole.moderator]);
    }
  } catch {
    isModerator = false;
  }

  if (!isModerator) {
    // For public visitors:
    // User MUST have a valid authenticated cookie generated after OTP verification or registration,
    // and that cookie MUST match this specific registration record or phone number!
    const isPassOwner =
      auth.isAuthenticated &&
      auth.hasActiveRegistration &&
      (auth.registrationId === id || auth.mobileNumber === res.registration.mobileNumber);

    if (!isPassOwner) {
      // Unauthorized attempt to view someone else's pass!
      // Redirect to mobile entry page with unauthorized alert
      redirect(`/registration/${registrationId}?unauthorized=true`);
    }
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
