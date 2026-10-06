"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Ticket,
  Scan,
  Activity,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  Key,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Link from "next/link";

interface DashboardClientProps {
  firstName: string;
  metrics: any;
}

export function DashboardClient({ firstName, metrics }: DashboardClientProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const m = metrics || {
    totalEvents: 0,
    totalPasses: 0,
    totalTokensGenerated: 0,
    activePassesCount: 0,
    usedPassesCount: 0,
    totalCheckIns: 0,
    approvedCheckIns: 0,
    deniedCheckIns: 0,
    approvalRate: 100,
    recentEvents: [],
    recentCheckIns: [],
    timelineData: [],
    passDistribution: [],
    capacityData: [],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Welcome Back
              </span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Hello, {firstName}!
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-pink-600 hover:bg-pink-500 text-white transition-all shadow-lg shadow-pink-600/20 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Manage Events
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-pink-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Events</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">{m.totalEvents}</p>
          <span className="text-[11px] text-muted-foreground font-medium">Active Registry</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Passes</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-purple-600 dark:text-purple-400">{m.totalPasses}</p>
          <span className="text-[11px] text-muted-foreground font-medium">
            {m.activePassesCount} Active • {m.usedPassesCount} Used
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Tokens Generated</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-amber-600 dark:text-amber-400">{m.totalTokensGenerated ?? m.totalPasses}</p>
          <span className="text-[11px] text-muted-foreground font-medium">Generated EK Tokens</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Gate Scans</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">{m.totalCheckIns}</p>
          <span className="text-[11px] text-muted-foreground font-medium">
            {m.approvedCheckIns} Approved • {m.deniedCheckIns} Denied
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-pink-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Approval Rate</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-pink-600 dark:text-pink-400">{m.approvalRate}%</p>
          <span className="text-[11px] text-muted-foreground font-medium">Gate Security Score</span>
        </div>
      </div>

      {/* Charts Section */}
      {isMounted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart 1: Gate Traffic Scan Area Chart */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> Live Gate Activity (7 Days)
                </h3>
                <p className="text-xs text-muted-foreground">Volume of approved entries vs denied scans</p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={m.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDenied" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "currentColor" }} />
                  <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="approved"
                    name="Approved Scans"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorApproved)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="denied"
                    name="Denied Scans"
                    stroke="#f43f5e"
                    fillOpacity={1}
                    fill="url(#colorDenied)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Pass Status Distribution Pie Chart */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-500" /> Pass Status Distribution
              </h3>
              <p className="text-xs text-muted-foreground">Breakdown of issued pass statuses</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={m.passDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {m.passDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Chart 3 & Recent Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Capacity vs Issued Bar Chart */}
        {isMounted && (
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-500" /> Event Capacity & Issuance
            </h3>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.capacityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="title" tick={{ fontSize: 11, fill: "currentColor" }} />
                  <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="passes" name="Passes Issued" fill="#ec4899" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="capacity" name="Max Capacity" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Live Recent Gate Activity */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Scan className="w-4 h-4 text-emerald-500" /> Recent Gate Check-Ins
              </h3>
              <Link
                href="/events"
                className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
              >
                View Events <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {m.recentCheckIns.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">No recent scan activity</p>
              ) : (
                m.recentCheckIns.map((ci: any) => (
                  <div
                    key={ci.id}
                    className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${ci.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            }`}
                        >
                          {ci.status}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {ci.pass?.holderName || "Guest Attendee"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{ci.event?.title || "Event"}</p>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(ci.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
