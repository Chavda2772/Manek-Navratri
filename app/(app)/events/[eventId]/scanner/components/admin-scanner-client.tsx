"use client";

import { validatePassTokenAction, type ScanResult } from "@/actions/event.actions";
import { formatUserTime } from "@/utility/date-time-fn";
import { AlertCircle, Camera, Clock, FlipHorizontal, Keyboard, Loader2, RefreshCw, ShieldCheck, ShieldX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AdminScannerClientProps {
  event: any;
}

function formatTimeAgo(dateInput: Date | string | number, currentTime: Date = new Date()): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const diffInSeconds = Math.max(0, Math.floor((currentTime.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds === 1 ? "" : "s"} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    const remSec = diffInSeconds % 60;
    if (remSec > 0) {
      return `${diffInMinutes} min ${remSec} sec ago`;
    }
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    const remMin = diffInMinutes % 60;
    if (remMin > 0) {
      return `${diffInHours} hr ${remMin} min ago`;
    }
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
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
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    if (!lastResult?.pass?.usedAt) return;
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [lastResult?.pass?.usedAt]);

  const html5QrcodeRef = useRef<any>(null);
  const processingRef = useRef(false);
  const lastScannedTokenRef = useRef<string | null>(null);

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
              } catch (e) {
                // ignore
              }
            });
        } else {
          try {
            html5QrcodeRef.current.clear();
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore
      }
      html5QrcodeRef.current = null;
    }

    // Force release all active camera media stream tracks on document video elements
    if (typeof document !== "undefined") {
      const videoElements = document.querySelectorAll<HTMLVideoElement>("video");
      videoElements.forEach((video) => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          video.srcObject = null;
        }
      });
    }
  }, []);

  // Handle route change / back navigation cleanup
  useEffect(() => {
    const handleNavigationCleanup = () => {
      stopCameraTracks();
    };

    window.addEventListener("popstate", handleNavigationCleanup);
    window.addEventListener("pagehide", handleNavigationCleanup);
    window.addEventListener("beforeunload", handleNavigationCleanup);

    return () => {
      window.removeEventListener("popstate", handleNavigationCleanup);
      window.removeEventListener("pagehide", handleNavigationCleanup);
      window.removeEventListener("beforeunload", handleNavigationCleanup);
      stopCameraTracks();
    };
  }, [stopCameraTracks]);

  // Extract pass token from URL or text string
  const extractToken = (rawText: string): string => {
    const trimmed = rawText.trim();
    // Check if URL like http://.../p/ek_123456
    const urlMatch = trimmed.match(/\/p\/(ek_[a-zA-Z0-9]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    // Check direct token match
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

      // Trigger device haptic feedback if supported
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch (e) {
          // ignore
        }
      }

      try {
        const res = await validatePassTokenAction(event.id, token, "Gate Camera Scanner");
        setLastResult(res);

        if (res.status === "APPROVED") {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      } catch (err: any) {
        toast.error(err?.message || "Validation error");
      } finally {
        setLoading(false);
        // Allow rescanning after 2.5 seconds
        setTimeout(() => {
          processingRef.current = false;
        }, 2500);
      }
    },
    [event.id]
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

        const config = {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return {
              width: Math.max(180, qrboxSize),
              height: Math.max(180, qrboxSize),
            };
          },
          aspectRatio: 1.0,
        };

        await html5Qrcode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            if (isMounted) {
              handleValidateToken(decodedText);
            }
          },
          () => {
            // silent frame scan callback
          }
        );

        if (isMounted) {
          setCameraActive(true);
          setCameraError(null);
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
  }, [handleValidateToken, manualInput, facingMode, stopCameraTracks]);

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

  return (
    <div className="max-w-xl mx-auto space-y-4 px-2 sm:px-0">
      {event.status && event.status !== "ACTIVE" && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${event.status === "ON_HOLD"
          ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300"
          : "bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300"
          }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            <strong>Gate Alert:</strong> Event is currently <strong>{event.status.replace("_", " ")}</strong>. All pass entry scans will be denied.
          </span>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-semibold">
            <Camera className="w-3.5 h-3.5 animate-pulse" /> Live Camera Scanner
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!manualInput && cameraActive && (
            <button
              onClick={toggleFacingMode}
              className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold flex items-center gap-1 cursor-pointer border border-border"
              title="Flip Camera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              setManualInput(!manualInput);
              resetScanner();
            }}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            {manualInput ? "Camera Mode" : "Manual Entry"}
          </button>
        </div>
      </div>

      {/* Main Camera View Container */}
      {!manualInput ? (
        <div className="relative rounded-3xl overflow-hidden bg-black border border-border shadow-2xl aspect-square w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center justify-center">
          {/* HTML5 Qr Code Video Viewfinder */}
          <div id="qr-reader" className="w-full h-full object-cover [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

          {/* Scanner Overlay Frame Animation */}
          {cameraActive && !lastResult && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Target Bounding Box */}
              <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-pink-500/80 rounded-3xl relative shadow-[0_0_50px_rgba(236,72,153,0.3)]">
                {/* Corner Markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-pink-500 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-pink-500 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-pink-500 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-pink-500 rounded-br-xl" />

                {/* Laser Scanning Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_15px_#ec4899] animate-bounce mt-24 sm:mt-32" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-white/90 mt-3 bg-black/70 px-3 py-1 rounded-full backdrop-blur-md">
                Align QR Code within frame
              </span>
            </div>
          )}

          {/* Camera Loading / Permissions Error Screen */}
          {(!cameraActive || cameraError) && (
            <div className="absolute inset-0 bg-card/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4 z-20">
              {cameraError ? (
                <>
                  <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-rose-500" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Camera Access Required</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">{cameraError}</p>
                  <button
                    onClick={() => setManualInput(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Use Manual Token Entry
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                  <p className="text-xs font-medium text-muted-foreground">Initializing Phone Camera...</p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Manual Token Entry Fallback */
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-4 max-w-md mx-auto">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-pink-500" /> Enter Pass Token Manually
          </h3>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. ek_1a2b3c4d5e6f"
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            />
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Validate Pass
            </button>
          </form>
        </div>
      )}

      {/* Validation Result Display Card */}
      {lastResult && (
        <div
          className={`p-5 sm:p-6 rounded-3xl border shadow-2xl transition-all duration-300 animate-in fade-in zoom-in max-w-md mx-auto ${lastResult.status === "APPROVED"
            ? "bg-emerald-500/10 dark:bg-emerald-950/50 border-emerald-500/60 shadow-emerald-500/20"
            : "bg-rose-500/10 dark:bg-rose-950/50 border-rose-500/60 shadow-rose-500/20"
            }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${lastResult.status === "APPROVED"
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white"
                  }`}
              >
                {lastResult.status === "APPROVED" ? (
                  <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
                ) : (
                  <ShieldX className="w-6 h-6 sm:w-7 sm:h-7" />
                )}
              </div>

              <div>
                <span
                  className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${lastResult.status === "APPROVED"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    }`}
                >
                  {lastResult.status}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-foreground pt-0.5 leading-snug">{lastResult.message}</h3>
              </div>
            </div>

            <button
              onClick={resetScanner}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-1.5 transition-all cursor-pointer border border-border shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Next Scan
            </button>
          </div>

          {/* If pass was ALREADY USED, show how many seconds/minutes ago */}
          {lastResult.status === "DENIED" && lastResult.pass?.usedAt && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block text-rose-600 dark:text-rose-400">
                    Used
                  </span>
                  <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-300">
                    {formatTimeAgo(lastResult.pass.usedAt, now)}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300">
                {formatUserTime(lastResult.pass.usedAt)}
              </span>
            </div>
          )}

          {lastResult.pass && (
            <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground font-medium">Attendee Name</span>
                <p className="text-xs sm:text-sm font-bold text-foreground truncate">{lastResult.pass.holderName}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Attendee Email</span>
                <p className="text-xs sm:text-sm font-bold text-foreground truncate">{lastResult.pass.holderEmail}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground font-medium">Scanned Token</span>
                <p className="font-mono text-xs text-purple-600 dark:text-purple-300 font-semibold break-all">{scannedToken}</p>
              </div>
            </div>
          )}

          {lastResult.rejectionReason && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-2">
              Reason: {lastResult.rejectionReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
