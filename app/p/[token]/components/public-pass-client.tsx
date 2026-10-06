"use client";

import { envClient } from "@/lib/env.client";
import { downloadQRCodeFromSvg } from "@/lib/qr-code";
import { formatDateDifferenceToNow } from "@/utility/date-time-fn";
import { AnimatePresence, motion } from "framer-motion";
import { toPng } from "html-to-image";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  QrCode,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface PublicPassClientProps {
  pass: any;
  event: any;
  eventDateFormatted: string;
  eventTimeFormatted?: string;
}

type StatusTheme = {
  badgeClass: string;
  badgeLabel: string;
  glowClass: string;
  borderClass: string;
  headerGradient: string;
  accentText: string;
  statusDot: string;
  IconComponent: any;
};

const STATUS_THEMES: Record<string, StatusTheme> = {
  ACTIVE: {
    badgeClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    badgeLabel: "VALID ENTRY PASS",
    glowClass: "bg-emerald-500/20",
    borderClass: "border-emerald-500/30 shadow-emerald-950/40",
    headerGradient: "from-emerald-950/80 via-zinc-900 to-zinc-900",
    accentText: "text-emerald-400",
    statusDot: "bg-emerald-400 animate-ping",
    IconComponent: CheckCircle2,
  },
  USED: {
    badgeClass: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    badgeLabel: "ALREADY USED",
    glowClass: "bg-rose-600/20",
    borderClass: "border-rose-500/30 shadow-rose-950/40",
    headerGradient: "from-rose-950/80 via-zinc-900 to-zinc-900",
    accentText: "text-rose-400",
    statusDot: "bg-rose-400",
    IconComponent: XCircle,
  },
  EXPIRED: {
    badgeClass: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    badgeLabel: "PASS EXPIRED",
    glowClass: "bg-amber-500/20",
    borderClass: "border-amber-500/30 shadow-amber-950/40",
    headerGradient: "from-amber-950/80 via-zinc-900 to-zinc-900",
    accentText: "text-amber-400",
    statusDot: "bg-amber-400",
    IconComponent: AlertTriangle,
  },
  CANCELLED: {
    badgeClass: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    badgeLabel: "CANCELLED PASS",
    glowClass: "bg-rose-600/20",
    borderClass: "border-rose-500/30 shadow-rose-950/40",
    headerGradient: "from-rose-950/80 via-zinc-900 to-zinc-900",
    accentText: "text-rose-400",
    statusDot: "bg-rose-400",
    IconComponent: XCircle,
  },
};

export function PublicPassClient({
  pass,
  event,
  eventDateFormatted,
  eventTimeFormatted,
}: PublicPassClientProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const [downloadingPass, setDownloadingPass] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const statusKey = (pass?.status || "ACTIVE").toUpperCase();
  const theme = STATUS_THEMES[statusKey] || STATUS_THEMES.ACTIVE;
  const StatusIcon = theme.IconComponent;
  const isUsed = statusKey === "USED";

  // Determine attendee role
  const getAttendeeInfo = () => {
    const primaryName = pass.registration?.primaryName;
    const holderName = pass.holderName?.trim();

    if (primaryName && holderName && primaryName.toLowerCase() === holderName.toLowerCase()) {
      return { label: "Primary Attendee", isPrimary: true };
    }

    if (pass.registration?.familyMembers?.length) {
      const match = pass.registration.familyMembers.find(
        (m: any) => m.name?.toLowerCase().trim() === holderName?.toLowerCase()
      );
      if (match?.relation) {
        return { label: `Family Member • ${match.relation}`, isPrimary: false };
      }
    }

    if (pass.holderEmail && pass.holderEmail.includes("+")) {
      const match = pass.holderEmail.match(/\+([^@]+)@/);
      if (match?.[1]) {
        const rel = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        return { label: `Family Member • ${rel}`, isPrimary: false };
      }
    }

    return { label: "General Pass", isPrimary: false };
  };

  const attendeeInfo = getAttendeeInfo();
  const locationQuery = event?.location ? encodeURIComponent(event.location) : "";
  const googleMapsUrl = locationQuery ? `https://www.google.com/maps/search/?api=1&query=${locationQuery}` : null;

  // Formatted share message
  const getShareText = () => {
    const lines = [
      `🎟️ *Entry Pass: ${event?.title || "Special Event"}*`,
      `👤 *Attendee:* ${pass.holderName} (${attendeeInfo.label})`,
      `📅 *Date:* ${eventDateFormatted}${eventTimeFormatted ? ` • ${eventTimeFormatted}` : ""}`,
    ];
    if (event?.location) {
      lines.push(`📍 *Venue:* ${event.location}`);
    }
    lines.push("");
    lines.push(`👉 *Scan & View Pass:*`);
    lines.push(currentUrl || (typeof window !== "undefined" ? window.location.href : ""));
    lines.push("");
    lines.push(`_Please present this QR code at the entrance gate._`);
    return lines.join("\n");
  };

  // 1. Copy Link handler
  const handleCopyLink = async () => {
    const url = currentUrl || window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      toast.success("Pass link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  // 2. Copy Token handler
  const handleCopyToken = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pass.token);
      }
      setCopiedToken(true);
      toast.success("Pass token copied!");
      setTimeout(() => setCopiedToken(false), 2500);
    } catch {
      toast.error("Failed to copy token.");
    }
  };

  // 3. Native Share handler
  const handleNativeShare = async () => {
    const url = currentUrl || window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${pass.holderName}'s Event Pass`,
          text: `Here is the digital entry pass for ${pass.holderName} for ${event?.title || "Event"}.`,
          url: url,
        });
        toast.success("Pass shared successfully!");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          // Open share modal if native share failed
          setShareModalOpen(true);
        }
      }
    } else {
      setShareModalOpen(true);
    }
  };

  // 4. WhatsApp Share
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareText());
    const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  // 5. Telegram Share
  const handleTelegramShare = () => {
    const url = encodeURIComponent(currentUrl || window.location.href);
    const text = encodeURIComponent(`🎟️ Entry Pass for ${pass.holderName} • ${event?.title || "Event"}`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank", "noopener,noreferrer");
  };

  // 6. Download Full Ticket PNG
  const handleDownloadFullPass = async () => {
    if (!cardRef.current) return;
    setDownloadingPass(true);

    const node = cardRef.current;
    const originalBackdropFilter = node.style.backdropFilter;
    const originalWebkitBackdropFilter = (node.style as any).webkitBackdropFilter;

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

      toast.success("Pass image saved to downloads!");
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
      setDownloadingPass(false);
    }
  };

  // 7. Download Standalone QR Code
  const handleDownloadQR = async () => {
    if (!qrContainerRef.current) return;
    const svg = qrContainerRef.current.querySelector("svg");
    if (!svg) {
      toast.error("QR Code element not found.");
      return;
    }

    setDownloadingQR(true);
    try {
      const sanitizeName = (pass.holderName || "pass").replace(/[^a-zA-Z0-9_-]/g, "_");
      await downloadQRCodeFromSvg(svg, `EventKey_QR_${sanitizeName}`, 600);
      toast.success("QR code downloaded!");
    } catch {
      toast.error("Failed to download QR code.");
    } finally {
      setDownloadingQR(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-start p-3 sm:p-6 font-sans selection:bg-pink-500 overflow-x-hidden relative">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <div
          className={`w-[340px] h-[340px] sm:w-[620px] sm:h-[620px] ${theme.glowClass} rounded-full blur-[140px] sm:blur-[180px] transition-all duration-700`}
        />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-4 my-auto py-4">
        {/* Capturable Ticket Pass Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          ref={cardRef}
          className={`rounded-3xl bg-zinc-900/95 border ${theme.borderClass} shadow-2xl overflow-hidden backdrop-blur-2xl transition-all duration-300 w-full relative`}
        >
          {/* Upper Ticket Header (Event Details) */}
          <div className={`p-5 sm:p-6 bg-gradient-to-br ${theme.headerGradient} space-y-3.5`}>
            {/* Status & Token row */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[11px] uppercase tracking-wider px-3 py-1 rounded-full ${theme.badgeClass} flex items-center gap-1.5 shrink-0 shadow-sm`}
              >
                <span className={`w-2 h-2 rounded-full ${theme.statusDot}`} />
                <StatusIcon className="w-3 h-3 shrink-0" />
                <span>{theme.badgeLabel}</span>
              </span>
            </div>

            {/* Event Title */}
            <div className="space-y-1 pt-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight break-words">
                {event?.title || "Special Event"}
              </h1>
              {event?.description && (
                <p className="text-xs text-zinc-400 line-clamp-1">{event.description}</p>
              )}
            </div>

            {/* Event Meta Details Grid */}
            <div className="pt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-950/50 px-2.5 py-1 rounded-lg border border-zinc-800/60 font-medium">
                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{eventDateFormatted}</span>
              </div>

              {eventTimeFormatted && (
                <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-950/50 px-2.5 py-1 rounded-lg border border-zinc-800/60 font-medium">
                  <Clock className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>{eventTimeFormatted}</span>
                </div>
              )}

              {event?.location && (
                <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-950/50 px-2.5 py-1 rounded-lg border border-zinc-800/60 font-medium max-w-full">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{event.location}</span>
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-zinc-300 ml-0.5 inline-flex"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* If pass was used, show used timestamp banner */}
            {isUsed && (pass.usedAt || pass.updatedAt) && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs flex items-center justify-between gap-2 shadow-inner">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" /> Entry scanned at gate
                </span>
                <span className="text-[11px] font-mono text-rose-400 shrink-0">
                  {formatDateDifferenceToNow(pass.usedAt || pass.updatedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Perforated Ticket Divider with Left and Right Semicircular Cutouts */}
          <div className="relative py-2 flex items-center justify-center overflow-visible bg-zinc-900/95">
            {/* Left Cutout */}
            <div className="absolute -left-3.5 w-7 h-7 rounded-full bg-zinc-950 border-r border-zinc-700/60 shadow-inner z-20 pointer-events-none" />
            {/* Dashed Line */}
            <div className="w-full border-t-2 border-dashed border-zinc-700/60" />
            {/* Right Cutout */}
            <div className="absolute -right-3.5 w-7 h-7 rounded-full bg-zinc-950 border-l border-zinc-700/60 shadow-inner z-20 pointer-events-none" />
          </div>

          {/* Middle Ticket Body (QR Code & Attendee Details) */}
          <div className="p-5 sm:p-7 flex flex-col items-center justify-center space-y-5 text-center bg-zinc-900/60">
            {/* Attendee Profile Section */}
            <div className="space-y-1.5 w-full px-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {attendeeInfo.label}
                </span>
                {pass.registration?.place && (
                  <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-pink-400" /> {pass.registration.place}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">
                {pass.holderName}
              </h2>

              {pass.registration?.mobileNumber && (
                <p className="text-xs text-zinc-400 font-mono">
                  +91 {pass.registration.mobileNumber}
                </p>
              )}
            </div>

            {/* QR Code Presentation Box with Corner Reticle Frame */}
            <div className="relative p-4 sm:p-5 rounded-2xl bg-white shadow-2xl flex items-center justify-center border-2 border-zinc-200">
              {/* Corner Viewfinder Accents */}
              <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-pink-500 rounded-tl pointer-events-none" />
              <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-pink-500 rounded-tr pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-pink-500 rounded-bl pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-pink-500 rounded-br pointer-events-none" />

              <div ref={qrContainerRef} className="overflow-hidden">
                <QRCode
                  value={pass.token}
                  size={210}
                  bgColor="#FFFFFF"
                  fgColor="#09090b"
                  level="Q"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
            </div>

            {/* Token Code Display with 1-Click Copy */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 bg-zinc-950/80 px-3 py-1 rounded-lg border border-zinc-800">
                {pass.token}
              </span>
              <button
                onClick={handleCopyToken}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                title="Copy Token"
              >
                {copiedToken ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Share & Actions Hub (Below Card) */}
        <div className="space-y-3 pt-1">
          {/* Primary Share Buttons Row */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShare}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span>Share on WhatsApp</span>
            </button>

            {/* Share Menu / Drawer Button */}
            <button
              onClick={() => setShareModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-950/40 border border-pink-500/30 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Share Options</span>
            </button>
          </div>

          {/* Secondary Action Row: Copy Link & Download Ticket */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-zinc-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-800 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Pass Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadFullPass}
              disabled={downloadingPass}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-zinc-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-800 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadingPass ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Saving Image...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Save Image Pass</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Back Link */}
          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              Powered by <span className="text-zinc-300 font-bold">
                {envClient.NEXT_PUBLIC_APP_NAME}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      <AnimatePresence>
        {shareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-5 sm:p-6 shadow-2xl space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Share Event Pass</h3>
                    <p className="text-[11px] text-zinc-400">Send this pass to the attendee</p>
                  </div>
                </div>

                <button
                  onClick={() => setShareModalOpen(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Attendee Preview Chip */}
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Pass Details
                </span>
                <p className="text-sm font-black text-white truncate">{pass.holderName}</p>
                <p className="text-xs text-zinc-400 truncate">{event?.title || "Special Event"}</p>
              </div>

              {/* Share Channels */}
              <div className="space-y-2">
                {/* 1. WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full p-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    Share on WhatsApp
                  </span>
                  <span className="text-[11px] text-emerald-400/80 font-bold">Open App →</span>
                </button>

                {/* 2. Device Sheet (if supported) */}
                {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full p-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-purple-400" />
                      More Apps (Device Share)
                    </span>
                    <span className="text-[11px] text-purple-400/80 font-bold">Sheet →</span>
                  </button>
                )}

                {/* 3. Telegram */}
                <button
                  onClick={handleTelegramShare}
                  className="w-full p-3 rounded-xl bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/30 text-sky-300 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Send className="w-4 h-4 text-sky-400" />
                    Share via Telegram
                  </span>
                  <span className="text-[11px] text-sky-400/80 font-bold">Send →</span>
                </button>
              </div>

              {/* Direct Copy Link Input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-zinc-400 block">
                  Pass URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 truncate focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-xs border border-zinc-700 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Offline Downloads */}
              <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShareModalOpen(false);
                    handleDownloadFullPass();
                  }}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Save Pass PNG</span>
                </button>

                <button
                  onClick={handleDownloadQR}
                  disabled={downloadingQR}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {downloadingQR ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
                  ) : (
                    <QrCode className="w-3.5 h-3.5 text-pink-400" />
                  )}
                  <span>QR Code Only</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
