"use client";

import { validatePassTokenAction, type ScanResult } from "@/actions/event.actions";
import { formatUserTime } from "@/utility/date-time-fn";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FlipHorizontal,
  Infinity as InfinityIcon,
  Keyboard,
  Loader2,
  MapPin,
  Phone,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Ticket,
  User,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AdminScannerClientProps {
  event: any;
}

function getRelationBadge(relation: string) {
  const rel = relation.toLowerCase();
  if (rel === "wife" || rel === "husband" || rel === "spouse") {
    return {
      label: relation,
      className: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
    };
  }
  if (rel === "mother" || rel === "father" || rel === "parent") {
    return {
      label: relation,
      className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    };
  }
  if (rel === "son" || rel === "daughter" || rel === "child") {
    return {
      label: relation,
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    };
  }
  if (rel === "brother" || rel === "sister" || rel === "sibling") {
    return {
      label: relation,
      className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  }
  return {
    label: relation,
    className: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  };
}

function formatTimeAgo(dateInput: Date | string | number, currentTime: Date = new Date()): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const diffInSeconds = Math.max(0, Math.floor((currentTime.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  return `${Math.floor(diffInHours / 24)}d ago`;
}

function playScanSound(status: "APPROVED" | "DENIED") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (status === "APPROVED") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.08);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.28);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio context may require user activation
  }
}

export function AdminScannerClient({ event }: AdminScannerClientProps) {
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [recentScans, setRecentScans] = useState<any[]>(event.checkIns || []);

  const html5QrcodeRef = useRef<any>(null);
  const processingRef = useRef(false);
  const lastScannedTokenRef = useRef<string | null>(null);

  // Periodic clock for relative time display
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper to safely stop all camera tracks and html5Qrcode instance
  const stopCameraTracks = useCallback(() => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          html5QrcodeRef.current
            .stop()
            .catch(() => { })
            .finally(() => {
              try {
                html5QrcodeRef.current.clear();
              } catch (e) { }
            });
        } else {
          try {
            html5QrcodeRef.current.clear();
          } catch (e) { }
        }
      } catch (e) { }
      html5QrcodeRef.current = null;
    }

    if (typeof document !== "undefined") {
      const videoElements = document.querySelectorAll<HTMLVideoElement>("video");
      videoElements.forEach((video) => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }
      });
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // Check torch capabilities on active video tracks
  const checkTorchSupport = useCallback(() => {
    try {
      const video = document.querySelector("#qr-reader video") as HTMLVideoElement;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          const capabilities = track.getCapabilities() as any;
          if (capabilities && capabilities.torch) {
            setTorchSupported(true);
          }
        }
      }
    } catch (e) { }
  }, []);

  // Toggle camera flashlight
  const toggleTorch = async () => {
    try {
      const video = document.querySelector("#qr-reader video") as HTMLVideoElement;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setTorchOn(nextState);
      } else {
        toast.info("Torch not supported on this camera");
      }
    } catch (err: any) {
      console.error("Torch error:", err);
      toast.error("Could not toggle flashlight");
    }
  };

  // Cleanup on route navigation or unload
  useEffect(() => {
    const handleCleanup = () => stopCameraTracks();
    window.addEventListener("popstate", handleCleanup);
    window.addEventListener("pagehide", handleCleanup);
    window.addEventListener("beforeunload", handleCleanup);

    return () => {
      window.removeEventListener("popstate", handleCleanup);
      window.removeEventListener("pagehide", handleCleanup);
      window.removeEventListener("beforeunload", handleCleanup);
      stopCameraTracks();
    };
  }, [stopCameraTracks]);

  // Extract pass token from URL or text string
  const extractToken = (rawText: string): string => {
    const trimmed = rawText.trim();
    const urlMatch = trimmed.match(/\/p\/(ek_[a-zA-Z0-9]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    const tokenMatch = trimmed.match(/ek_[a-zA-Z0-9]+/);
    if (tokenMatch) {
      return tokenMatch[0];
    }
    return trimmed;
  };

  const handleValidateToken = useCallback(
    async (rawText: string) => {
      const token = extractToken(rawText);
      if (!token || processingRef.current) return;

      processingRef.current = true;
      lastScannedTokenRef.current = token;
      setScannedToken(token);
      setLoading(true);

      // Trigger device haptics if supported
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch (e) { }
      }

      try {
        const res = await validatePassTokenAction(event.id, token, "Gate Camera Scanner");
        setLastResult(res);

        if (soundEnabled) {
          playScanSound(res.status);
        }

        if (res.status === "APPROVED") {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }

        // Add to recent scans list
        if (res.checkIn) {
          setRecentScans((prev) => [
            {
              id: res.checkIn!.id,
              scannedAt: res.checkIn!.scannedAt,
              status: res.status,
              rejectionReason: res.rejectionReason,
              scannedToken: token,
              pass: res.pass ? { holderName: res.pass.holderName } : null,
            },
            ...prev.slice(0, 19),
          ]);
        }
      } catch (err: any) {
        toast.error(err?.message || "Validation error");
      } finally {
        setLoading(false);
        // Cool-down before accepting another scan in background
        setTimeout(() => {
          processingRef.current = false;
        }, 1800);
      }
    },
    [event.id, soundEnabled]
  );

  // Start Camera Stream using html5-qrcode
  useEffect(() => {
    if (manualInput) {
      stopCameraTracks();
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        stopCameraTracks();

        const { Html5Qrcode } = await import("html5-qrcode");
        const html5Qrcode = new Html5Qrcode("qr-reader");
        html5QrcodeRef.current = html5Qrcode;

        const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * (isMobile ? 0.72 : 0.65));
            return {
              width: Math.max(200, qrboxSize),
              height: Math.max(200, qrboxSize),
            };
          },
          aspectRatio: isMobile ? undefined : 1.0,
        };

        await html5Qrcode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            if (isMounted) {
              handleValidateToken(decodedText);
            }
          },
          () => { }
        );

        if (isMounted) {
          setCameraActive(true);
          setCameraError(null);
          setTimeout(checkTorchSupport, 800);
        }
      } catch (err: any) {
        console.error("Camera scanner error:", err);
        if (isMounted) {
          setCameraActive(false);
          setCameraError(
            err?.message || "Could not access camera. Please verify permissions or access via HTTPS."
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopCameraTracks();
    };
  }, [handleValidateToken, manualInput, facingMode, stopCameraTracks, checkTorchSupport]);

  const resetScanner = () => {
    setLastResult(null);
    setScannedToken(null);
    processingRef.current = false;
    lastScannedTokenRef.current = null;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      handleValidateToken(tokenInput);
      setTokenInput("");
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const copyToken = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Token copied to clipboard");
  };

  const isEventEnded = event.endDate && new Date() > new Date(event.endDate);

  // Formatted event dates for "Allowed upto end of event" badge
  const formattedEndDate = new Date(event.endDate).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full">
      {/* ========================================================
          DESKTOP & TABLET TWO-COLUMN LAYOUT
          (On mobile, Left Column is Fixed Full-Screen Viewport)
          ======================================================== */}
      <div className="md:grid md:grid-cols-12 md:gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
        {/* ========================================================
            LEFT COLUMN: CAMERA SCANNER SECTION
            - Mobile: Fullscreen Fixed Container (fixed inset-0 z-50)
            - Tablet/Desktop: Regular grid column (md:col-span-5 lg:col-span-5)
            ======================================================== */}
        <div className="fixed inset-0 z-50 md:relative md:inset-auto md:z-0 md:col-span-5 lg:col-span-5 flex flex-col bg-black md:bg-transparent overflow-hidden">
          {/* ========================================================
              MOBILE FLOATING TOP HEADER (Overlaid on camera feed)
              ======================================================== */}
          <div className="md:hidden absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
            <Link
              href={`/events/${event.id}`}
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center active:scale-95 shadow-lg transition-all cursor-pointer"
              title="Back to Event"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center gap-2 shadow-lg max-w-[200px]">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899] shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-black text-white uppercase tracking-wider block leading-none">
                  Gate Scanner
                </span>
                <span className="text-[10px] text-zinc-300 font-medium truncate block leading-tight pt-0.5">
                  {event.title}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center active:scale-95 shadow-lg transition-all cursor-pointer"
              title="Toggle Beep Sound"
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-zinc-400" />
              )}
            </button>
          </div>

          {/* Desktop/Tablet Header Bar above Viewfinder (hidden on mobile) */}
          <div className="hidden md:flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold border border-pink-500/20">
                <Camera className="w-3.5 h-3.5 animate-pulse text-pink-500" /> Live Gate Scanner
              </span>
            </div>

            <div className="flex items-center gap-2">
              {torchSupported && cameraActive && !manualInput && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${torchOn
                    ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                    : "bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border"
                    }`}
                  title="Toggle Torch"
                >
                  <Zap className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-border"
                title="Toggle Scan Sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              </button>

              {!manualInput && cameraActive && (
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-border"
                  title="Flip Camera"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setManualInput(!manualInput);
                  resetScanner();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${manualInput
                  ? "bg-pink-600 text-white border-pink-500"
                  : "bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border"
                  }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                {manualInput ? "Camera Mode" : "Manual Entry"}
              </button>
            </div>
          </div>

          {/* ========================================================
              CAMERA VIEWPORT (Full Screen on Mobile, Aspect Square on Desktop)
              ======================================================== */}
          <div className="relative flex-1 md:flex-initial md:aspect-square w-full h-full md:h-auto bg-black md:rounded-3xl md:overflow-hidden md:border md:border-border md:shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Native Video Feed Container (Stretches edge-to-edge) */}
            <div
              id="qr-reader"
              className="absolute inset-0 w-full h-full object-cover [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&>div]:!w-full [&>div]:!h-full [&_div]:!max-w-none"
            />

            {/* ========================================================
                MOBILE CUTOUT MASK & HUD OVERLAY
                (Creates native Google Lens/Apple Camera scanner cutout)
                ======================================================== */}
            {cameraActive && !manualInput && (
              <>
                {/* 1. Mobile Specific Cutout Mask (Hidden on md) */}
                <div className="md:hidden absolute inset-0 z-20 pointer-events-none flex flex-col">
                  {/* Top Masking Zone */}
                  <div className="flex-1 bg-black/55 backdrop-blur-[0.5px] min-h-[70px]" />

                  {/* Center Scanning Cutout Row */}
                  <div className="flex items-center justify-center shrink-0">
                    {/* Left Mask */}
                    <div className="flex-1 bg-black/55 backdrop-blur-[0.5px] h-[76vw] max-h-[310px]" />

                    {/* Clear Center Cutout Target Window */}
                    <div className="w-[76vw] h-[76vw] max-w-[310px] max-h-[310px] relative rounded-3xl border-2 border-pink-500/80 shadow-[0_0_60px_rgba(236,72,153,0.35)] overflow-hidden shrink-0">
                      {/* High-visibility Corner Brackets */}
                      <div className="absolute -top-1 -left-1 w-9 h-9 border-t-4 border-l-4 border-pink-500 rounded-tl-2xl shadow-[0_0_15px_#ec4899]" />
                      <div className="absolute -top-1 -right-1 w-9 h-9 border-t-4 border-r-4 border-pink-500 rounded-tr-2xl shadow-[0_0_15px_#ec4899]" />
                      <div className="absolute -bottom-1 -left-1 w-9 h-9 border-b-4 border-l-4 border-pink-500 rounded-bl-2xl shadow-[0_0_15px_#ec4899]" />
                      <div className="absolute -bottom-1 -right-1 w-9 h-9 border-b-4 border-r-4 border-pink-500 rounded-br-2xl shadow-[0_0_15px_#ec4899]" />

                      {/* Animated Sweeping Laser Beam */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-[0_0_20px_#ec4899] animate-scanner-beam" />

                      {/* Center Crosshair Target Dot */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <div className="w-14 h-14 rounded-full border border-pink-500/40 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_6px_#ec4899]" />
                        </div>
                      </div>
                    </div>

                    {/* Right Mask */}
                    <div className="flex-1 bg-black/55 backdrop-blur-[0.5px] h-[76vw] max-h-[310px]" />
                  </div>

                  {/* Bottom Masking Zone with Floating Controls */}
                  <div className="flex-1 bg-black/55 backdrop-blur-[0.5px] flex flex-col items-center justify-between pt-4 pb-8 min-h-[170px] pointer-events-auto">
                    {/* Viewfinder Instructions & Validity Badges */}
                    <div className="flex flex-col items-center gap-1.5 px-4 text-center">
                      <span className="px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-white font-mono text-xs font-semibold shadow-xl flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-pink-400 animate-pulse" /> Align Pass QR in frame
                      </span>

                      <span className="text-[10px] text-zinc-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 border border-white/10 mt-0.5">
                        <InfinityIcon className="w-3.5 h-3.5 text-cyan-400" /> Allowed until end of event
                      </span>
                    </div>

                    {/* Mobile Bottom Thumb Controls Floating Bar */}
                    <div className="p-2 rounded-full bg-black/65 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center gap-4">
                      {torchSupported && (
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${torchOn
                            ? "bg-amber-400 text-black shadow-[0_0_20px_#fbbf24] scale-105"
                            : "bg-white/15 text-white hover:bg-white/25 active:scale-95"
                            }`}
                          title="Toggle Flashlight"
                        >
                          <Zap className="w-5 h-5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                        title="Flip Camera"
                      >
                        <FlipHorizontal className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setManualInput(true);
                          resetScanner();
                        }}
                        className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                        title="Enter Pass Code"
                      >
                        <Keyboard className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Desktop/Tablet Viewfinder Frame (Hidden on mobile) */}
                <div className="hidden md:flex absolute inset-0 pointer-events-none flex-col items-center justify-center p-6">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-pink-500/70 rounded-3xl relative shadow-[0_0_50px_rgba(236,72,153,0.35)] flex items-center justify-center">
                    <div className="absolute -top-1.5 -left-1.5 w-7 h-7 border-t-4 border-l-4 border-pink-500 rounded-tl-xl" />
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 border-t-4 border-r-4 border-pink-500 rounded-tr-xl" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-4 border-l-4 border-pink-500 rounded-bl-xl" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-4 border-r-4 border-pink-500 rounded-br-xl" />

                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-[0_0_20px_#ec4899] animate-scanner-beam" />
                  </div>

                  <div className="mt-4 flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-mono text-white bg-black/75 px-3.5 py-1 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-md">
                      <QrCode className="w-3.5 h-3.5 text-pink-400" /> Align Pass QR in frame
                    </span>

                    <span className="text-[10px] text-zinc-300 bg-black/60 px-3 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 border border-white/5">
                      <InfinityIcon className="w-3 h-3 text-cyan-400" /> Allowed until end of event
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Camera Error or Permission Fallback Screen */}
            {(!cameraActive || cameraError) && !manualInput && (
              <div className="absolute inset-0 bg-card/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4 z-20">
                {cameraError ? (
                  <>
                    <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
                    <h3 className="text-sm sm:text-base font-bold text-foreground">Camera Access Required</h3>
                    <p className="text-xs text-muted-foreground max-w-xs">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setManualInput(true)}
                      className="px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all"
                    >
                      Use Manual Token Entry
                    </button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
                    <p className="text-xs font-semibold text-muted-foreground">Initializing Camera Stream...</p>
                  </>
                )}
              </div>
            )}

            {/* Manual Entry Fallback inside Viewport (if toggled) */}
            {manualInput && (
              <div className="absolute inset-0 bg-card/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center z-30">
                <div className="w-full max-w-sm space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto">
                    <Keyboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Manual Pass Entry</h3>
                    <p className="text-xs text-muted-foreground">Type or paste pass token (e.g. ek_1a2b3c4d)</p>
                  </div>
                  <form onSubmit={handleManualSubmit} className="space-y-3">
                    <input
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="e.g. ek_1a2b3c4d5e6f"
                      className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-center"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={loading || !tokenInput.trim()}
                      className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Verify & Admit Pass
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setManualInput(false)}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                  >
                    Return to Camera Scanner
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop/Tablet Event Policy & Validity Banner below viewfinder */}
          <div className="hidden md:block mt-4 space-y-3">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <InfinityIcon className="w-4 h-4 text-cyan-500" /> Entry Policy
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Multiple Entry Allowed
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Passes generated for this event remain valid for entry across the entire festival duration until{" "}
                <strong className="text-foreground">{formattedEndDate}</strong>.
              </p>
            </div>

            {/* Quick Gate Scan Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground font-semibold block">Total Scans</span>
                <strong className="text-base font-black text-foreground">{recentScans.length}</strong>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground font-semibold block">Approved</span>
                <strong className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {recentScans.filter((s) => s.status === "APPROVED").length}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground font-semibold block">Denied</span>
                <strong className="text-base font-black text-rose-600 dark:text-rose-400">
                  {recentScans.filter((s) => s.status === "DENIED").length}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: SCAN RESULTS & RECENT GATE ACTIVITY
            (Visible on Desktop & Tablet side-by-side with camera)
            ======================================================== */}
        <div className="hidden md:block md:col-span-7 lg:col-span-7 space-y-4">
          {/* Active Result View */}
          {lastResult ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* 1. Status Hero Banner */}
              <div
                className={`p-5 rounded-3xl border shadow-xl flex items-center justify-between gap-4 ${lastResult.status === "APPROVED"
                  ? "bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-card border-emerald-500/50 shadow-emerald-500/10"
                  : "bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-card border-rose-500/50 shadow-rose-500/10"
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${lastResult.status === "APPROVED"
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                      : "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                      }`}
                  >
                    {lastResult.status === "APPROVED" ? (
                      <ShieldCheck className="w-7 h-7" />
                    ) : (
                      <ShieldX className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${lastResult.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          }`}
                      >
                        {lastResult.status === "APPROVED" ? "Entry Approved" : "Entry Denied"}
                      </span>
                      {lastResult.pass?.totalCheckIns && lastResult.pass.totalCheckIns > 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                          Check-in #{lastResult.pass.totalCheckIns}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-black text-foreground pt-0.5 leading-snug">
                      {lastResult.message}
                    </h2>
                    {lastResult.rejectionReason && (
                      <p className="text-xs font-semibold text-rose-500 pt-0.5">
                        Reason: {lastResult.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetScanner}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-1.5 transition-all cursor-pointer border border-border shrink-0 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Next Scan
                </button>
              </div>

              {/* 2. Registered Person Summary Card */}
              <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                        Primary Registered Person
                      </span>
                      <h3 className="text-base font-black text-foreground leading-tight">
                        {lastResult.registration?.primaryName || lastResult.pass?.holderName || "Registered Attendee"}
                      </h3>
                    </div>
                  </div>

                  {lastResult.registration?.status && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {lastResult.registration.status}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {lastResult.registration?.mobileNumber && (
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <span className="text-muted-foreground text-[10px] font-semibold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-pink-500" /> Mobile Number
                      </span>
                      <a
                        href={`tel:${lastResult.registration.mobileNumber}`}
                        className="text-xs font-bold text-foreground hover:underline block pt-0.5"
                      >
                        {lastResult.registration.mobileNumber}
                      </a>
                    </div>
                  )}

                  {lastResult.registration?.place && (
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <span className="text-muted-foreground text-[10px] font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-500" /> Town / Place
                      </span>
                      <p className="text-xs font-bold text-foreground pt-0.5">
                        {lastResult.registration.place}
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 col-span-2 sm:col-span-1">
                    <span className="text-muted-foreground text-[10px] font-semibold flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-500" /> Total Group
                    </span>
                    <p className="text-xs font-bold text-foreground pt-0.5">
                      {lastResult.registration?.totalMembers || 1} Member(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. List of Registered Family Members */}
              <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <h4 className="text-sm font-bold text-foreground">
                      Family Members List ({lastResult.registration?.familyMembers?.length || 0})
                    </h4>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Accompanying with primary pass
                  </span>
                </div>

                {lastResult.registration?.familyMembers && lastResult.registration.familyMembers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {lastResult.registration.familyMembers.map((member, idx) => {
                      const badge = getRelationBadge(member.relation);
                      return (
                        <div
                          key={member.id || idx}
                          className="p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 border border-border flex items-center justify-between gap-2.5 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-secondary-foreground shrink-0 border border-border">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{member.name}</p>
                              <span className="text-[10px] text-muted-foreground block">
                                Member #{idx + 1}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-muted/20 border border-dashed border-border text-center">
                    <p className="text-xs text-muted-foreground font-medium">
                      Solo Attendee Registration (No accompanying family members registered)
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Pass Details & Gate Audit Footprint */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-pink-500 shrink-0" />
                  <span className="font-mono text-xs font-semibold text-foreground">
                    Token: {scannedToken}
                  </span>
                  <button
                    type="button"
                    onClick={() => scannedToken && copyToken(scannedToken)}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copy Token"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    Scanned at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span>•</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                    <InfinityIcon className="w-3 h-3" /> Valid for re-entry
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Idle State: Hero Instruction Card + Recent Gate Activity */
            <div className="space-y-4">
              {/* Ready to Scan Hero Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-card border border-pink-500/20 shadow-xs flex flex-col sm:flex-row items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0">
                  <QrCode className="w-8 h-8 text-pink-500 animate-pulse" />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    Gate Scanner Ready
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                    Point camera at the attendee&apos;s QR code. Once scanned, this panel will display the registered person, their accompanying family members, and entry approval in real time.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-semibold text-pink-600 dark:text-pink-400">
                    <span className="flex items-center gap-1">
                      <InfinityIcon className="w-3.5 h-3.5" /> Passes allowed until end of event ({formattedEndDate})
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Gate Activity Log */}
              <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h4 className="text-sm font-bold text-foreground">
                      Recent Gate Activity ({recentScans.length})
                    </h4>
                  </div>
                  <Link
                    href={`/events/${event.id}/check-ins`}
                    className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
                  >
                    View All Audit Logs
                  </Link>
                </div>

                {recentScans.length > 0 ? (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {recentScans.slice(0, 10).map((ci: any) => (
                      <div
                        key={ci.id}
                        className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ci.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                              }`}
                          >
                            {ci.status}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">
                              {ci.pass?.holderName || "Attendee Token"}
                            </p>
                            {ci.rejectionReason && (
                              <p className="text-[10px] text-rose-500 truncate">{ci.rejectionReason}</p>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {formatTimeAgo(ci.scannedAt, now)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-muted/20 border border-dashed border-border text-center">
                    <p className="text-xs text-muted-foreground">
                      No gate check-in logs recorded yet. Scanned passes will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MOBILE SCAN RESULT BOTTOM SHEET (Drawer over camera)
          Slides up smoothly from bottom upon scanning on mobile
          ======================================================== */}
      {lastResult && (
        <div className="md:hidden fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-card border-t border-border rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Grab handle */}
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto" />

            {/* Mobile Status Header */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${lastResult.status === "APPROVED"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${lastResult.status === "APPROVED" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    }`}
                >
                  {lastResult.status === "APPROVED" ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <ShieldX className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {lastResult.status === "APPROVED" ? "ACCESS GRANTED" : "ACCESS DENIED"}
                    </span>
                    {lastResult.pass?.totalCheckIns && lastResult.pass.totalCheckIns > 1 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                        Entry #{lastResult.pass.totalCheckIns}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-foreground pt-0.5">{lastResult.message}</h3>
                  {lastResult.rejectionReason && (
                    <p className="text-[11px] text-rose-500 font-semibold">{lastResult.rejectionReason}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={resetScanner}
                className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Registered Person Card */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                    Primary Registered Person
                  </span>
                  <h4 className="text-base font-black text-foreground">
                    {lastResult.registration?.primaryName || lastResult.pass?.holderName || "Registered Attendee"}
                  </h4>
                </div>
                {lastResult.registration?.status && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {lastResult.registration.status}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {lastResult.registration?.mobileNumber && (
                  <a
                    href={`tel:${lastResult.registration.mobileNumber}`}
                    className="p-2.5 rounded-xl bg-card border border-border flex items-center gap-2 font-bold text-foreground"
                  >
                    <Phone className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                    <span className="truncate">{lastResult.registration.mobileNumber}</span>
                  </a>
                )}
                {lastResult.registration?.place && (
                  <div className="p-2.5 rounded-xl bg-card border border-border flex items-center gap-2 font-bold text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">{lastResult.registration.place}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile List of Family Members */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-500" /> Accompanying Family (
                  {lastResult.registration?.familyMembers?.length || 0})
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {lastResult.registration?.totalMembers || 1} Total Group
                </span>
              </div>

              {lastResult.registration?.familyMembers && lastResult.registration.familyMembers.length > 0 ? (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {lastResult.registration.familyMembers.map((member, idx) => {
                    const badge = getRelationBadge(member.relation);
                    return (
                      <div
                        key={member.id || idx}
                        className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] text-secondary-foreground shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground truncate">{member.name}</span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center py-2">
                  Solo Attendee • No accompanying family members
                </p>
              )}
            </div>

            {/* Mobile Pass Footprint */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span className="font-mono truncate max-w-[170px]">{scannedToken}</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                <InfinityIcon className="w-3.5 h-3.5" /> Valid till end of event
              </span>
            </div>

            {/* Mobile Primary Action: Ready for Next Scan */}
            <button
              type="button"
              onClick={resetScanner}
              className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 animate-spin-reverse" />
              Scan Next Attendee
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
