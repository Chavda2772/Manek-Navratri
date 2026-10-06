"use server";

import { getUserSession } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/prisma";

export async function getFirstName() {
  const session = await getUserSession();
  return session?.user?.name ? session.user.name.split(" ")[0] : "User";
}

export async function getDashboardMetricsAction() {
  try {
    const session = await getUserSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const [
      totalEvents,
      totalPasses,
      totalTokensGenerated,
      activePassesCount,
      usedPassesCount,
      totalCheckIns,
      approvedCheckIns,
      deniedCheckIns,
      recentEvents,
      recentCheckIns,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.pass.count(),
      prisma.pass.count({ where: { createdBy: session?.user?.id } }),
      prisma.pass.count({ where: { status: "ACTIVE" } }),
      prisma.pass.count({ where: { status: "USED" } }),
      prisma.checkIn.count(),
      prisma.checkIn.count({ where: { status: "APPROVED" } }),
      prisma.checkIn.count({ where: { status: "DENIED" } }),
      prisma.event.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: {
            select: { passes: true, checkIns: true },
          },
        },
      }),
      prisma.checkIn.findMany({
        orderBy: { scannedAt: "desc" },
        take: 6,
        include: {
          event: { select: { title: true } },
          pass: { select: { holderName: true, holderEmail: true } },
        },
      }),
    ]);

    // Build timeline data for charts (last 7 days scan volume)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const checkInsLast7Days = await prisma.checkIn.findMany({
      where: {
        scannedAt: { gte: sevenDaysAgo },
      },
      select: {
        scannedAt: true,
        status: true,
      },
    });

    const dayMap: Record<string, { date: string; approved: number; denied: number; total: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      dayMap[dayName] = { date: dayName, approved: 0, denied: 0, total: 0 };
    }

    checkInsLast7Days.forEach((ci) => {
      const dayName = new Date(ci.scannedAt).toLocaleDateString("en-US", { weekday: "short" });
      if (dayMap[dayName]) {
        dayMap[dayName].total += 1;
        if (ci.status === "APPROVED") {
          dayMap[dayName].approved += 1;
        } else {
          dayMap[dayName].denied += 1;
        }
      }
    });

    const timelineData = Object.values(dayMap);

    const passDistribution = [
      { name: "Active", value: activePassesCount, color: "#10b981" },
      { name: "Used", value: usedPassesCount, color: "#a855f7" },
      { name: "Other", value: Math.max(0, totalPasses - activePassesCount - usedPassesCount), color: "#f43f5e" },
    ];

    const capacityData = recentEvents.map((evt) => ({
      title: evt.title.length > 12 ? `${evt.title.slice(0, 12)}...` : evt.title,
      capacity: evt.capacity,
      passes: evt._count.passes,
      scans: evt._count.checkIns,
    }));

    return {
      success: true,
      data: {
        totalEvents,
        totalPasses,
        totalTokensGenerated,
        activePassesCount,
        usedPassesCount,
        totalCheckIns,
        approvedCheckIns,
        deniedCheckIns,
        approvalRate: totalCheckIns > 0 ? Math.round((approvedCheckIns / totalCheckIns) * 100) : 100,
        recentEvents,
        recentCheckIns,
        timelineData,
        passDistribution,
        capacityData,
      },
    };
  } catch (error: any) {
    console.error("getDashboardMetricsAction error:", error);
    return { success: false, error: error?.message || "Failed to fetch dashboard metrics" };
  }
}
