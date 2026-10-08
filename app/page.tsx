import { isSetupRequired } from "@/lib/setup";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
    // Check if initial setup is needed
    if (await isSetupRequired()) {
        redirect("/setup" as any);
    }

    // Redirect root path directly to the Manek Navratri welcome landing page
    redirect("/welcome" as any);
}