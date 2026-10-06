import { prisma } from "@/lib/prisma/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegistrationRootPage() {
  // Find first active event with registration enabled
  const event = await prisma.event.findFirst({
    where: {
      registrationEnabled: true,
      status: "ACTIVE",
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      registrationId: true,
    },
  });

  if (event) {
    redirect(`/registration/${event.registrationId || event.id}`);
  }

  // If no active registration event found, redirect to home
  redirect("/");
}
