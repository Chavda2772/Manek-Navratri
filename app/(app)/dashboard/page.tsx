import { getDashboardMetricsAction } from "@/actions/dashboard.actions";
import MobileNav from "@/components/tab/mobile-tab";
import { getUserSession } from "@/lib/auth/auth";
import { DashboardClient } from "./components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getUserSession();
  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const metricsRes = await getDashboardMetricsAction();
  const metrics = metricsRes.success ? metricsRes.data : null;

  return (
    <>
      <div className="flex-1 px-4 sm:px-6 space-y-6 sm:space-y-8 pb-34 max-w-7xl mx-auto w-full">
        <DashboardClient
          firstName={firstName}
          metrics={metrics}
        />
      </div>

      <MobileNav />
    </>
  );
}
