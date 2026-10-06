"use client";

import { useState } from "react";
import { Activity, ShieldX, Search } from "lucide-react";

interface CheckInsClientProps {
  event: any;
  stats: any;
}

export function CheckInsClient({ event, stats }: CheckInsClientProps) {
  const [checkIns] = useState<any[]>(event.checkIns || []);
  const [filter, setFilter] = useState<"ALL" | "APPROVED" | "DENIED">("ALL");
  const [search, setSearch] = useState("");

  const filtered = checkIns.filter((item) => {
    const matchesStatus = filter === "ALL" || item.status === filter;
    const matchesSearch =
      (item.pass?.holderName || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.pass?.holderEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.scannedToken || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.rejectionReason || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Total Scans Executed</span>
          <p className="mt-2 text-2xl font-bold text-foreground">{checkIns.length}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Approved Entries</span>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.approvedCount || 0}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Denied Rejections</span>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{stats?.deniedCount || 0}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Approval Rate</span>
          <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {checkIns.length > 0 ? Math.round(((stats?.approvedCount || 0) / checkIns.length) * 100) : 100}%
          </p>
        </div>
      </div>

      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${filter === "ALL" ? "bg-foreground text-background font-bold" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
          >
            All Logs ({checkIns.length})
          </button>
          <button
            onClick={() => setFilter("APPROVED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${filter === "APPROVED"
                ? "bg-emerald-500 text-white font-bold"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
          >
            Approved ({stats?.approvedCount || 0})
          </button>
          <button
            onClick={() => setFilter("DENIED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${filter === "DENIED"
                ? "bg-rose-500 text-white font-bold"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
          >
            Denied ({stats?.deniedCount || 0})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendee, token, or reason..."
            className="w-full pl-9 pr-4 py-2 sm:py-1.5 bg-background border border-input rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Check-ins Table / Cards List */}
      <div className="p-3 sm:p-4 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-12">No check-in logs match current criteria</p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 ${item.status === "APPROVED"
                  ? "bg-muted/40 border-emerald-500/30 hover:border-emerald-500/50"
                  : "bg-muted/40 border-rose-500/30 hover:border-rose-500/50"
                }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${item.status === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                      }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-sm font-bold text-foreground truncate">
                    {item.pass?.holderName || "Unregistered Token"}
                  </span>
                  {item.pass?.holderEmail && (
                    <span className="text-xs text-muted-foreground font-medium truncate">({item.pass.holderEmail})</span>
                  )}
                </div>

                {item.rejectionReason && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 break-words">
                    <ShieldX className="w-3.5 h-3.5 shrink-0" /> {item.rejectionReason}
                  </p>
                )}

                <p className="text-[11px] text-muted-foreground font-mono break-all">
                  Scanned Token: <code className="text-foreground font-semibold">{item.scannedToken}</code>
                </p>
              </div>

              <div className="text-left md:text-right space-y-1 shrink-0 pt-2 border-t border-border/40 md:border-t-0 md:pt-0">
                <span className="text-xs font-mono text-foreground block font-bold">
                  {new Date(item.scannedAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block">
                  Scanned by: {item.scannedBy || "Gate Scanner"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
