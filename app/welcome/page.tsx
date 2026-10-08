import { getActiveRegistrationLinkAction } from "@/actions/registration.actions";
import { Metadata } from "next";
import { WelcomePageClient } from "./components/welcome-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "માણેક નવરાત્રી ૨૦૨૬ • Manek Navratri | ManekNavratri.com",
  description:
    "Official website of Manek Navratri (ManekNavratri.com), Devbhumi Dwarka. Under the divine patronage of Hon. MLA Pabubha Manek and Sahadev Manek. 9 nights of grand traditional Raas Garba starting 11 October 2026.",
  openGraph: {
    title: "માણેક નવરાત્રી ૨૦૨૬ • Manek Navratri | ManekNavratri.com",
    description:
      "Official website of Manek Navratri, Devbhumi Dwarka. Register your digital entry pass online at ManekNavratri.com.",
    url: "https://maneknavratri.com",
    siteName: "Manek Navratri",
    type: "website",
  },
};

export default async function WelcomePage() {
  // Dynamically fetch the active registration link from Database / Environment
  const registrationUrl = await getActiveRegistrationLinkAction();
  return <WelcomePageClient initialRegistrationUrl={registrationUrl} />;
}
