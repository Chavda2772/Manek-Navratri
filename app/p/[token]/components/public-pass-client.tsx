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
  Flame,
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
  Ticket,
  User,
  X,
  XCircle,
  ArrowLeft,
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
  gujBadgeLabel: string;
  glowClass: string;
  borderClass: string;
  statusDot: string;
  IconComponent: any;
};

const STATUS_THEMES: Record<string, StatusTheme> = {
  ACTIVE: {
    badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-400/50",
    badgeLabel: "VALID ENTRY PASS",
    gujBadgeLabel: "અધિકૃત પ્રવેશ પાસ",
    glowClass: "bg-amber-500/20",
    borderClass: "border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.3)]",
    statusDot: "bg-emerald-400 animate-ping",
    IconComponent: CheckCircle2,
  },
  USED: {
    badgeClass: "bg-rose-950/80 text-rose-300 border border-rose-500/50",
    badgeLabel: "ALREADY SCANNED",
    gujBadgeLabel: "પ્રવેશ સ્કેન થયેલ છે",
    glowClass: "bg-rose-600/20",
    borderClass: "border-rose-500/40 shadow-rose-950/40",
    statusDot: "bg-rose-400",
    IconComponent: XCircle,
  },
  EXPIRED: {
    badgeClass: "bg-amber-950/80 text-amber-300 border border-amber-500/50",
    badgeLabel: "PASS EXPIRED",
    gujBadgeLabel: "પાસ પૂર્ણ થયેલ છે",
    glowClass: "bg-amber-600/20",
    borderClass: "border-amber-500/40 shadow-amber-950/40",
    statusDot: "bg-amber-400",
    IconComponent: AlertTriangle,
  },
  CANCELLED: {
    badgeClass: "bg-rose-950/80 text-rose-300 border border-rose-500/50",
    badgeLabel: "CANCELLED PASS",
    gujBadgeLabel: "રદ થયેલ પાસ",
    glowClass: "bg-rose-600/20",
    borderClass: "border-rose-500/40 shadow-rose-950/40",
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [downloadingPass, setDownloadingPass] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const statusKey = (pass.status as string) || "ACTIVE";
  const theme = STATUS_THEMES[statusKey] || STATUS_THEMES.ACTIVE;
  const StatusIcon = theme.IconComponent;
  const isUsed = statusKey === "USED";

  // Attendee relation badge logic
  const isPrimary =
    !pass.relation ||
    pass.relation.toLowerCase() === "primary" ||
    pass.relation.toLowerCase() === "self";

  const attendeeInfo = {
    label: isPrimary ? "મુખ્ય ખેલૈયા • Primary Attendee" : `પરિવારજન • ${pass.relation}`,
    subLabel: isPrimary ? "Primary Passholder" : `Family Member (${pass.relation})`,
  };

  const googleMapsUrl = "https://maps.app.goo.gl/WjA94KiergA8LHVs5";

  const getShareText = () => {
    const url = currentUrl || (typeof window !== "undefined" ? window.location.href : "");
    return (
      `🎟️ *માણેક નવરાત્રી ૨૦૨૬ - સત્તાવાર ડિજિટલ પ્રવેશ પાસ*\n\n` +
      `👤 ખેલૈયા: *${pass.holderName}*\n` +
      `📍 સ્થળ: માણેક નવરાત્રી ગ્રાઉન્ડ, દેવભૂમિ દ્વારકા\n` +
      `🗓️ તારીખ: ${eventDateFormatted} • ૯:૦૦ PM થી\n` +
      `🔑 પાસ કોડ: ${pass.token}\n\n` +
      `ગેટ પર પ્રવેશ માટે તમારો QR કોડ પાસ નીચેની લિંક પરથી જુઓ:\n${url}`
    );
  };

  // 1. Copy Link handler
  const handleCopyLink = async () => {
    try {
      const url = currentUrl || window.location.href;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
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
      if (navigator.clipboard) {
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
          title: `${pass.holderName}'s Manek Navratri Pass`,
          text: `Here is the digital entry pass for ${pass.holderName} for Manek Navratri 2026.`,
          url: url,
        });
        toast.success("Pass shared successfully!");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
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
    const text = encodeURIComponent(`🎟️ Manek Navratri Pass for ${pass.holderName}`);
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
        backgroundColor: "#140104",
        style: {
          backdropFilter: "none",
          webkitBackdropFilter: "none",
          transform: "scale(1)",
        } as any,
      });

      const sanitizeName = (pass.holderName || "pass").replace(/[^a-zA-Z0-9_-]/g, "_");
      const link = document.createElement("a");
      link.download = `Manek_Navratri_Pass_${sanitizeName}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Pass ticket downloaded successfully!");
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
      await downloadQRCodeFromSvg(svg, `Manek_Navratri_QR_${sanitizeName}`, 600);
      toast.success("QR code downloaded!");
    } catch {
      toast.error("Failed to download QR code.");
    } finally {
      setDownloadingQR(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#140104] text-amber-50 flex flex-col items-center justify-start p-3 sm:p-6 font-sans selection:bg-amber-500 selection:text-black overflow-x-hidden relative">
      {/* Background Ambience & Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[radial-gradient(circle_at_center,rgba(180,18,36,0.3)_0%,rgba(100,5,18,0.15)_50%,transparent_75%)] blur-3xl" />
        <div className="absolute top-[25%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.14)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.12)_0%,transparent_70%)] blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.035] bg-repeat"
          style={{
            backgroundImage: `radial-gradient(#fbbf24 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 w-full max-w-xl mx-auto backdrop-blur-xl bg-[#1b0206]/85 border-b border-amber-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-2xl mb-4">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/welcome"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-200 hover:text-amber-300 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
              <ArrowLeft className="w-4 h-4 text-amber-400" />
            </div>
            <span>Festival Home</span>
          </Link>

          <Link href="/welcome" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-200 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <div className="w-full h-full rounded-full bg-[#290308] flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 font-serif">
                માણેક નવરાત્રી
              </span>
              <span className="text-[9px] text-amber-200/70 uppercase tracking-widest font-semibold">
                Devbhumi Dwarka
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="px-3 py-1.5 rounded-xl font-bold text-xs text-amber-200 hover:text-white bg-white/5 hover:bg-white/10 border border-amber-400/30 transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>Login</span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 w-full max-w-md space-y-4 my-auto py-2">
        {/* Sacred Auspicious Heading Inscription */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wide backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>॥ શ્રી દ્વારકાધીશાય નમઃ ॥ જય બહુચર માઁ ॥</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
        </div>

        {/* =========================================================================
            ROYAL MANEK NAVRATRI CAPTURABLE TICKET CARD
            ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          ref={cardRef}
          className={`rounded-3xl bg-gradient-to-b from-[#2e040b] via-[#200308] to-[#150104] border-2 ${theme.borderClass} shadow-[0_15px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl transition-all duration-300 w-full relative text-amber-50`}
        >
          {/* Top Gold Corner Accents */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-400 z-10" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-400 z-10" />

          {/* Upper Ticket Header (Festival & Organizer Details) */}
          <div className="p-5 sm:p-6 bg-gradient-to-b from-[#400711] via-[#2d040b] to-[#200308] space-y-3.5 relative">
            {/* Status & Badge Row */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1 rounded-full ${theme.badgeClass} flex items-center gap-1.5 shrink-0 shadow-sm font-bold`}
              >
                <span className={`w-2 h-2 rounded-full ${theme.statusDot}`} />
                <StatusIcon className="w-3 h-3 shrink-0" />
                <span>{theme.badgeLabel} • {theme.gujBadgeLabel}</span>
              </span>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                2026 PASS
              </span>
            </div>

            {/* Festival Title */}
            <div className="space-y-1 pt-1 text-center sm:text-left">
              <div className="inline-block">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#2a0408] bg-gradient-to-r from-amber-300 to-yellow-300 px-2.5 py-0.5 rounded-full shadow-sm">
                  DEVBHUMI DWARKA
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-400 font-serif tracking-tight leading-tight">
                માણેક નવરાત્રી ૨૦૨૬
              </h1>
              <p className="text-[11px] text-amber-200/80 font-medium">
                મુખ્ય પ્રેરક: શ્રી પબુભા માણેક (MLA દ્વારકા) &amp; શ્રી સહદેવ માણેક
              </p>
            </div>

            {/* Event Meta Details Grid */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-100 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{eventDateFormatted}</span>
              </div>

              {eventTimeFormatted && (
                <div className="flex items-center gap-1.5 text-amber-100 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{eventTimeFormatted}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-amber-100 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30 font-medium max-w-full">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">માણેક ગ્રાઉન્ડ, દ્વારકા</span>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-200 ml-0.5 inline-flex"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* If pass was used, show used timestamp banner */}
            {isUsed && (pass.usedAt || pass.updatedAt) && (
              <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/40 text-xs flex items-center justify-between gap-2 shadow-inner">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" /> Entry scanned at gate
                </span>
                <span className="text-[11px] font-mono text-rose-300 shrink-0">
                  {formatDateDifferenceToNow(pass.usedAt || pass.updatedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Perforated Ticket Divider with Left and Right Semicircular Cutouts */}
          <div className="relative py-2 flex items-center justify-center overflow-visible bg-[#200308]">
            {/* Left Cutout */}
            <div className="absolute -left-3.5 w-7 h-7 rounded-full bg-[#140104] border-r-2 border-amber-500/40 shadow-inner z-20 pointer-events-none" />
            {/* Dashed Line */}
            <div className="w-full border-t-2 border-dashed border-amber-500/40" />
            {/* Right Cutout */}
            <div className="absolute -right-3.5 w-7 h-7 rounded-full bg-[#140104] border-l-2 border-amber-500/40 shadow-inner z-20 pointer-events-none" />
          </div>

          {/* Middle Ticket Body (QR Code & Attendee Details) */}
          <div className="p-5 sm:p-7 flex flex-col items-center justify-center space-y-5 text-center bg-gradient-to-b from-[#200308] to-[#160205]">
            {/* Attendee Profile Section */}
            <div className="space-y-1.5 w-full px-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  {attendeeInfo.label}
                </span>
                {pass.registration?.place && (
                  <span className="text-[11px] font-bold text-amber-200/80 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> {pass.registration.place}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-amber-100 font-serif tracking-tight break-words">
                {pass.holderName}
              </h2>

              {pass.registration?.mobileNumber && (
                <p className="text-xs text-amber-300/80 font-mono font-bold">
                  📱 +91 {pass.registration.mobileNumber}
                </p>
              )}
            </div>

            {/* QR Code Presentation Box with Gold Viewfinder Reticles */}
            <div className="relative p-4 sm:p-5 rounded-2xl bg-white shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center border-2 border-amber-300">
              {/* Corner Viewfinder Accents */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-600 rounded-tl pointer-events-none" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-600 rounded-tr pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-600 rounded-bl pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-600 rounded-br pointer-events-none" />

              <div ref={qrContainerRef} className="overflow-hidden">
                <QRCode
                  value={pass.token}
                  size={210}
                  bgColor="#FFFFFF"
                  fgColor="#160205"
                  level="Q"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
            </div>

            {/* Token Code Display with 1-Click Copy */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-amber-200 bg-black/60 px-3 py-1.5 rounded-lg border border-amber-500/30">
                {pass.token}
              </span>
              <button
                onClick={handleCopyToken}
                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 transition-colors cursor-pointer"
                title="Copy Token"
              >
                {copiedToken ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Gate Advisory Notice */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-[11px] text-amber-200/80 leading-relaxed max-w-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400 inline mr-1 -mt-0.5" />
              <span>ગેટ પર મોબાઇલ સ્ક્રીન પર આ QR કોડ બતાવીને પ્રવેશ મેળવવો. પરંપરાગત વસ્ત્રો અનિવાર્ય છે.</span>
            </div>
          </div>

          {/* Bottom Gold Corner Accents */}
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-400 z-10" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-400 z-10" />
        </motion.div>

        {/* =========================================================================
            SHARE & ACTIONS HUB (BELOW CARD)
            ========================================================================= */}
        <div className="space-y-3 pt-2">
          {/* Primary Share Buttons Row */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShare}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span>Share on WhatsApp</span>
            </button>

            {/* Share Menu / Drawer Button */}
            <button
              onClick={() => setShareModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 active:scale-98 text-[#2a0408] font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 border border-amber-300 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Share Options</span>
            </button>
          </div>

          {/* Secondary Action Row: Copy Link & Download Ticket */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 active:scale-98 text-amber-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy Pass Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadFullPass}
              disabled={downloadingPass}
              className="w-full py-2.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 active:scale-98 text-amber-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadingPass ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Saving Image...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Image Pass</span>
                </>
              )}
            </button>
          </div>

          {/* Festival Highlights Footer Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#250409]/90 to-[#170205]/95 border border-amber-500/30 text-center space-y-1.5 backdrop-blur-md">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              માણેક નવરાત્રી ૨૦૨૬ • દેવભૂમિ દ્વારકા
            </div>
            <p className="text-xs text-amber-100 font-semibold">
              શ્રી પબુભા માણેક (MLA દ્વારકા) &amp; શ્રી સહદેવ માણેક
            </p>
            <p className="text-[10px] text-amber-200/60">
              ॥ જય શ્રી દ્વારકાધીશ • જય માઁ આશાપુરા • જય બહુચર માં ॥
            </p>
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
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#2e040b] via-[#210308] to-[#150104] border-2 border-amber-500/50 p-5 sm:p-6 shadow-2xl space-y-4 text-amber-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-amber-100 font-serif">Share Event Pass</h3>
                    <p className="text-[11px] text-amber-200/70">Send this pass to the attendee</p>
                  </div>
                </div>

                <button
                  onClick={() => setShareModalOpen(false)}
                  className="p-1.5 rounded-xl text-amber-300 hover:text-white hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Attendee Preview Chip */}
              <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Pass Details
                </span>
                <p className="text-sm font-black text-amber-100 truncate">{pass.holderName}</p>
                <p className="text-xs text-amber-200/70 truncate">માણેક નવરાત્રી ૨૦૨૬ • Devbhumi Dwarka</p>
              </div>

              {/* Share Channels */}
              <div className="space-y-2">
                {/* 1. WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
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
                    className="w-full p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      More Apps (Device Share)
                    </span>
                    <span className="text-[11px] text-amber-300 font-bold">Sheet →</span>
                  </button>
                )}

                {/* 3. Telegram */}
                <button
                  onClick={handleTelegramShare}
                  className="w-full p-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Send className="w-4 h-4 text-sky-400" />
                    Share via Telegram
                  </span>
                  <span className="text-[11px] text-sky-400 font-bold">Send →</span>
                </button>
              </div>

              {/* Direct Copy Link Input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-amber-300 block">
                  Pass URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="w-full px-3 py-2 text-xs font-mono bg-black/60 border border-amber-500/30 rounded-xl text-amber-100 truncate focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-[#2a0408] font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2a0408]" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#2a0408]" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Offline Downloads */}
              <div className="pt-2 border-t border-amber-500/20 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShareModalOpen(false);
                    handleDownloadFullPass();
                  }}
                  className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 text-amber-200 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Pass PNG</span>
                </button>

                <button
                  onClick={handleDownloadQR}
                  disabled={downloadingQR}
                  className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 text-amber-200 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {downloadingQR ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
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
