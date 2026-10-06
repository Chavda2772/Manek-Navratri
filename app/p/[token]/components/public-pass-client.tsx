"use client";

import { useRef, useState } from "react";
import { QRCodeView } from "@/components/qr-code-view";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  Download,
  Loader2,
  Sparkles,
  Ticket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import Link from "next/link";
import { formatDateDifferenceToNow } from "@/utility/date-time-fn";

interface PublicPassClientProps {
  pass: any;
  event: any;
  eventDateFormatted: string;
}

type StatusTheme = {
  badgeClass: string;
  badgeLabel: string;
  glowClass: string;
  borderClass: string;
  headerGradient: string;
  accentText: string;
  footerText: string;
  IconComponent: any;
};

const STATUS_THEMES: Record<string, StatusTheme> = {
  ACTIVE: {
    badgeClass: "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 font-black",
    badgeLabel: "✓ ACTIVE PASS",
    glowClass: "bg-emerald-500/20",
    borderClass: "border-emerald-500/40 shadow-emerald-950/40",
    headerGradient: "from-emerald-950/80 via-emerald-900/30 to-zinc-900",
    accentText: "text-emerald-400",
    footerText: "text-emerald-400",
    IconComponent: CheckCircle2,
  },
  USED: {
    badgeClass: "bg-rose-600 text-white shadow-lg shadow-rose-600/25 font-black",
    badgeLabel: "✕ USED PASS",
    glowClass: "bg-rose-600/20",
    borderClass: "border-rose-500/40 shadow-rose-950/40",
    headerGradient: "from-rose-950/80 via-rose-900/30 to-zinc-900",
    accentText: "text-rose-400",
    footerText: "text-rose-400",
    IconComponent: XCircle,
  },
  EXPIRED: {
    badgeClass: "bg-amber-500 text-black shadow-lg shadow-amber-500/25 font-black",
    badgeLabel: "⚠ EXPIRED PASS",
    glowClass: "bg-amber-500/20",
    borderClass: "border-amber-500/40 shadow-amber-950/40",
    headerGradient: "from-amber-950/80 via-amber-900/30 to-zinc-900",
    accentText: "text-amber-400",
    footerText: "text-amber-400",
    IconComponent: AlertTriangle,
  },
  CANCELLED: {
    badgeClass: "bg-rose-600 text-white shadow-lg shadow-rose-600/25 font-black",
    badgeLabel: "✕ CANCELLED PASS",
    glowClass: "bg-rose-600/20",
    borderClass: "border-rose-500/40 shadow-rose-950/40",
    headerGradient: "from-rose-950/80 via-rose-900/30 to-zinc-900",
    accentText: "text-rose-400",
    footerText: "text-rose-400",
    IconComponent: XCircle,
  },
};

export function PublicPassClient({ pass, event, eventDateFormatted }: PublicPassClientProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const statusKey = (pass?.status || "ACTIVE").toUpperCase();
  const theme = STATUS_THEMES[statusKey] || STATUS_THEMES.ACTIVE;
  const StatusIcon = theme.IconComponent;
  const isUsed = statusKey === "USED";

  const handleDownloadFullPass = async () => {
    if (!cardRef.current || isUsed) return;
    setDownloading(true);

    const node = cardRef.current;
    const originalBackdropFilter = node.style.backdropFilter;
    const originalWebkitBackdropFilter = (node.style as any).webkitBackdropFilter;

    // Save and clear backdrop filters on inner elements to avoid WebKit SVG foreignObject rendering blur artifacts
    const elementsWithBlur = node.querySelectorAll<HTMLElement>("*");
    const savedFilters: { el: HTMLElement; filter: string; webkitFilter: string }[] = [];

    try {
      node.style.backdropFilter = "none";
      (node.style as any).webkitBackdropFilter = "none";

      elementsWithBlur.forEach((el) => {
        const computed = window.getComputedStyle(el);
        if (computed.backdropFilter && computed.backdropFilter !== "none") {
          savedFilters.push({
            el,
            filter: el.style.backdropFilter,
            webkitFilter: (el.style as any).webkitBackdropFilter,
          });
          el.style.backdropFilter = "none";
          (el.style as any).webkitBackdropFilter = "none";
        }
      });

      // Wait a short frame for DOM style update stability
      await new Promise((r) => setTimeout(r, 120));

      const ratio = Math.max(3, typeof window !== "undefined" ? window.devicePixelRatio || 3 : 3);

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: ratio,
        backgroundColor: "#09090b",
        style: {
          backdropFilter: "none",
          webkitBackdropFilter: "none",
          transform: "scale(1)",
        } as any,
      });

      const sanitizeName = (pass.holderName || "pass").replace(/[^a-zA-Z0-9_-]/g, "_");
      const link = document.createElement("a");
      link.download = `EventKey_Pass_${sanitizeName}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Pass image downloaded successfully!");
    } catch (err: any) {
      console.error("Failed to capture pass image:", err);
      toast.error(err?.message || "Failed to download pass as image.");
    } finally {
      node.style.backdropFilter = originalBackdropFilter;
      (node.style as any).webkitBackdropFilter = originalWebkitBackdropFilter;
      savedFilters.forEach(({ el, filter, webkitFilter }) => {
        el.style.backdropFilter = filter;
        (el.style as any).webkitBackdropFilter = webkitFilter;
      });
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-3 sm:p-6 font-sans selection:bg-pink-500 overflow-x-hidden">
      {/* Dynamic Status Background Glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <div className={`w-[320px] h-[320px] sm:w-[600px] sm:h-[600px] ${theme.glowClass} rounded-full blur-[120px] sm:blur-[150px] transition-all duration-700`} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-4 sm:space-y-5 my-auto">
        {/* Top Control Bar with Download Action */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] sm:text-xs font-medium text-zinc-300 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" /> EventKey Verification
          </div>

          {!isUsed && (
            <button
              onClick={handleDownloadFullPass}
              disabled={downloading}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-lg shadow-pink-600/25 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> <span className="hidden sm:inline">Downloading...</span><span className="sm:hidden">Saving...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Download Pass</span><span className="sm:hidden">Download</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Capturable Pass Card */}
        <div
          ref={cardRef}
          className={`rounded-3xl bg-zinc-900/95 border ${theme.borderClass} shadow-2xl overflow-hidden backdrop-blur-2xl transition-all duration-300 w-full`}
        >
          {/* Top Ticket Header */}
          <div className={`p-4 sm:p-6 bg-gradient-to-br ${theme.headerGradient} border-b border-zinc-800/80 space-y-3`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-full ${theme.badgeClass} flex items-center gap-1.5 shrink-0`}>
                <StatusIcon className="w-3 h-3" /> {theme.badgeLabel}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-[150px] sm:max-w-none">
                {pass.token}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1">
              <div className="space-y-1 min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight break-words">{event?.title || "Special Event"}</h2>
                {event?.location && (
                  <p className="text-xs text-zinc-300 flex items-center gap-1.5 font-medium truncate">
                    <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" /> {event.location}
                  </p>
                )}
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" /> {eventDateFormatted}
                </p>
              </div>

              {isUsed && (pass.usedAt || pass.updatedAt) && (
                <div className="text-left sm:text-right shrink-0 bg-rose-950/80 border border-rose-500/40 px-3 py-1.5 rounded-2xl shadow-lg self-start sm:self-auto">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">
                    Used Pass
                  </span>
                  <span className="text-xs font-bold text-rose-200 block">
                    {formatDateDifferenceToNow(pass.usedAt || pass.updatedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Center Section */}
          <div className="p-5 sm:p-8 flex flex-col items-center justify-center space-y-4 sm:space-y-5 text-center bg-zinc-900/50">
            <QRCodeView
              data={pass.token}
              width={200}
              height={200}
              fileName={`pass-${pass.holderName}`}
              showDownload={false}
            />

            <div className="space-y-1 w-full px-2">
              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">
                Official Ticket Holder
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">{pass.holderName}</h3>
              <p className="text-xs text-zinc-400 font-medium truncate">{pass.holderEmail}</p>
            </div>
          </div>

          {/* Ticket Footer Security Info */}
          <div className="p-3.5 sm:p-4 bg-zinc-950 border-t border-zinc-800/80 text-center text-xs text-zinc-400 space-y-1">
            <p className={`flex items-center justify-center gap-1.5 font-bold ${theme.footerText}`}>
              <ShieldCheck className="w-4 h-4 shrink-0" /> Atomic Single-Entry Guaranteed
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">
              One Scan. One Entry. • EventKey Security Protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
