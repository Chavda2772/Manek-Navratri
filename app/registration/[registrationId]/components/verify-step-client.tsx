"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  verifyRegistrationOtpAction,
  sendRegistrationOtpAction,
  clearRegistrationSessionAction,
} from "@/actions/registration.actions";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  KeyRound,
  RotateCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface VerifyStepClientProps {
  registrationId: string;
  event: any;
  initialPhone?: string;
  initialOtpStatus?: {
    hasActiveOtp?: boolean;
    isLocked?: boolean;
    lockoutMinutes?: number;
    remainingAttempts?: number;
    maxAttempts?: number;
    attemptsCount?: number;
    secondsUntilResend?: number;
  };
}

export function VerifyStepClient({
  registrationId,
  event,
  initialPhone = "",
  initialOtpStatus,
}: VerifyStepClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = initialPhone || searchParams.get("phone") || "";

  // 6 individual digit cells
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [changingPhone, setChangingPhone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Throttling & lockout state from server
  const [isLocked, setIsLocked] = useState(initialOtpStatus?.isLocked || false);
  const [lockoutMinutes, setLockoutMinutes] = useState(
    initialOtpStatus?.lockoutMinutes || 15
  );
  const maxAttempts = initialOtpStatus?.maxAttempts || 5;
  const [remainingAttempts, setRemainingAttempts] = useState(
    typeof initialOtpStatus?.remainingAttempts === "number"
      ? initialOtpStatus.remainingAttempts
      : maxAttempts
  );

  // Resend countdown timer
  const [countdown, setCountdown] = useState(
    initialOtpStatus?.secondsUntilResend ?? 30
  );

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    // Focus the first input on initial mount
    inputRefs.current[0]?.focus();
  }, []);

  const fullOtp = digits.join("");

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleDigitChange = (index: number, value: string) => {
    if (isLocked) return;

    // Filter only numeric characters
    const cleaned = value.replace(/\D/g, "");

    // If pasted or typed multiple digits into one field
    if (cleaned.length > 1) {
      handlePastedCode(cleaned);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (error) setError(null);

    // Auto-advance to next input cell if typed
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (isLocked) return;

    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back to previous input and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePastedCode = (pastedText: string) => {
    if (isLocked) return;
    const cleaned = pastedText.replace(/\D/g, "").slice(0, 6);
    if (!cleaned) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = cleaned[i] || "";
    }
    setDigits(newDigits);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(cleaned.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleChangePhoneNumber = async () => {
    setChangingPhone(true);
    try {
      await clearRegistrationSessionAction(registrationId);
      router.push(`/registration/${registrationId}`);
    } catch {
      router.push(`/registration/${registrationId}`);
    } finally {
      setChangingPhone(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending || isLocked) return;

    setResending(true);
    setError(null);

    try {
      const res = await sendRegistrationOtpAction({
        registrationId,
        mobileNumber: phone,
      });

      if (!res.success) {
        if (res.isLocked) {
          setIsLocked(true);
          setRemainingAttempts(0);
        }
        setError(res.error || "Failed to resend code");
        toast.error(res.error || "Failed to resend OTP");
        return;
      }

      setCountdown(30);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      if (res.debugOtp) {
        toast.success(`New OTP Sent! Test Code: ${res.debugOtp}`, {
          duration: 10000,
        });
      } else {
        toast.success("New verification code sent to your WhatsApp!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network error while resending OTP");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isLocked) {
      toast.error(`Verification is locked. Please wait ${lockoutMinutes} minutes.`);
      return;
    }

    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyRegistrationOtpAction({
        registrationId,
        mobileNumber: phone,
        otp: fullOtp,
      });

      if (!res.success) {
        triggerShake();

        if (res.isLocked) {
          setIsLocked(true);
          setRemainingAttempts(0);
          if (res.lockoutMinutes) {
            setLockoutMinutes(res.lockoutMinutes);
          }
          setError(
            res.error || `Verification locked. Please wait ${res.lockoutMinutes || 15} minutes.`
          );
          toast.error("Maximum verification attempts exceeded. Account locked.");
          return;
        }

        if (typeof res.remainingAttempts === "number") {
          setRemainingAttempts(res.remainingAttempts);
        }

        setError(res.error || "Verification failed. Please check your code.");
        toast.error(res.error || "Verification failed");

        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      if (res.alreadyRegistered && res.registrationId) {
        toast.info("Registration found for this mobile number! Showing your pass...");
        router.push(
          `/registration/${registrationId}/success?id=${res.registrationId}&alreadyRegistered=true`
        );
        return;
      }

      setIsSuccess(true);
      toast.success("Phone number verified successfully!");

      setTimeout(() => {
        router.push(`/registration/${registrationId}/form`);
      }, 400);
    } catch (err: any) {
      console.error(err);
      setError("Network or verification error. Please try again.");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#2e040b]/95 via-[#210308]/95 to-[#160205]/98 border-2 border-amber-500/40 p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-6 text-amber-50"
    >
      {/* Decorative corner ornaments */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

      {/* Decorative ambient background glows */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top action bar: Change phone number & step tag */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
        <button
          type="button"
          onClick={handleChangePhoneNumber}
          disabled={changingPhone || loading}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-100 transition-colors cursor-pointer py-1 group"
        >
          {changingPhone ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          )}
          <span>Change phone number</span>
        </button>

        <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/40">
          Step 2 of 4
        </span>
      </div>

      {/* Title & mobile banner */}
      <div className="space-y-2 text-center sm:text-left relative z-10">
        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-400 font-serif tracking-tight">
          Verify Phone Number
        </h2>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <p className="text-xs sm:text-sm text-amber-200/80">
            Enter the 6-digit verification code sent to your WhatsApp
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-amber-500/30 text-amber-100 font-mono font-bold text-xs">
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            +91 {phone}
          </div>
        </div>
      </div>

      {/* Locked Out Alert Banner */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 sm:p-5 rounded-2xl bg-rose-950/70 border-2 border-rose-500/50 text-rose-200 space-y-2.5 shadow-md relative z-10"
        >
          <div className="flex items-center gap-2 font-black text-sm text-rose-300">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <span>Verification Locked for Security</span>
          </div>
          <p className="text-xs text-rose-200/80 leading-relaxed">
            You have reached the maximum allowed verification attempts ({maxAttempts}/{maxAttempts}). For your security, this verification code has been deactivated.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <span className="font-semibold text-rose-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 shrink-0" /> Lockout active for ~{lockoutMinutes} min
            </span>
            <button
              type="button"
              onClick={handleChangePhoneNumber}
              className="font-bold text-amber-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Try a different number
            </button>
          </div>
        </motion.div>
      )}

      {/* Attempts Counter Warning Banner */}
      {!isLocked && remainingAttempts < maxAttempts && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold relative z-10 ${
            remainingAttempts <= 1
              ? "bg-rose-950/70 border-rose-500/50 text-rose-200"
              : "bg-amber-950/70 border-amber-500/50 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              {remainingAttempts === 1
                ? "Last attempt! Code will lock on next failure."
                : "Incorrect verification code entered."}
            </span>
          </div>
          <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-black/60 border border-current/30 shrink-0">
            {remainingAttempts}/{maxAttempts} left
          </span>
        </motion.div>
      )}

      <form onSubmit={handleVerify} className="space-y-6 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Enter 6-Digit Code</span>
            </label>
            <div className="flex items-center gap-3 text-xs font-mono font-bold text-amber-300/80">
              {!isLocked && (
                <span className="text-[11px] font-sans text-amber-200/60 hidden sm:inline">
                  Max {maxAttempts} attempts
                </span>
              )}
              <span>{fullOtp.length}/6 digits</span>
            </div>
          </div>

          {/* Segmented 6-digit input boxes with shake effect */}
          <motion.div
            animate={
              shake
                ? {
                    x: [-12, 12, -8, 8, -4, 4, 0],
                  }
                : {}
            }
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="grid grid-cols-6 gap-2 sm:gap-3 py-1"
          >
            {digits.map((digit, index) => (
              <motion.div
                key={index}
                whileFocus={{ scale: isLocked ? 1 : 1.05 }}
                className="relative"
              >
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => {
                    e.preventDefault();
                    handlePastedCode(e.clipboardData.getData("text"));
                  }}
                  disabled={loading || isSuccess || isLocked}
                  className={`w-full h-14 sm:h-16 text-center text-2xl sm:text-3xl font-mono font-black rounded-2xl border-2 transition-all duration-200 outline-none ${
                    isLocked
                      ? "border-amber-500/20 bg-black/40 text-amber-200/40 cursor-not-allowed opacity-60"
                      : digit
                      ? "border-amber-400 bg-amber-500/15 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      : "border-amber-500/30 bg-black/40 hover:border-amber-500/60 text-amber-100"
                  } focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20`}
                />
              </motion.div>
            ))}
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Resend OTP section with countdown */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-amber-500/25 text-xs">
          <span className="text-amber-200/70">Didn&apos;t receive the code?</span>
          {isLocked ? (
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-400" /> Resend locked
            </span>
          ) : countdown > 0 ? (
            <div className="inline-flex items-center gap-1.5 text-amber-200/80 font-medium">
              <span>Resend code in</span>
              <span className="font-mono text-amber-300 font-black bg-black/50 px-2 py-0.5 rounded-lg border border-amber-500/30">
                {countdown}s
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending}
              className="font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <RotateCw className="w-3.5 h-3.5" /> Resend Code
                </>
              )}
            </button>
          )}
        </div>

        {/* Submit verification button */}
        <motion.div
          whileTap={{
            scale: fullOtp.length === 6 && !loading && !isLocked ? 0.98 : 1,
          }}
        >
          <Button
            type="submit"
            disabled={loading || fullOtp.length !== 6 || isSuccess || isLocked}
            className={`w-full h-14 rounded-2xl text-base font-black transition-all ${
              isLocked
                ? "bg-black/40 text-amber-200/40 border border-amber-500/20 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-[#2a0408] shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] border border-amber-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#2a0408]" />
                <span>Verifying Code...</span>
              </>
            ) : isLocked ? (
              <>
                <ShieldAlert className="w-5 h-5 mr-2 text-rose-400" />
                <span>Verification Locked ({lockoutMinutes}m)</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-700" />
                <span>Verified! Redirecting...</span>
              </>
            ) : (
              <>
                <span>Verify &amp; Proceed to Registration</span>
                <ArrowRight className="w-5 h-5 ml-1 text-[#2a0408]" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Security badge and secondary back link */}
        <div className="space-y-3 pt-1 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-200/70 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected by rate-limiting &amp; attempt throttling</span>
          </div>

          <div>
            <button
              type="button"
              onClick={handleChangePhoneNumber}
              disabled={changingPhone || loading}
              className="text-xs text-amber-200/70 hover:text-amber-100 font-medium transition-colors cursor-pointer"
            >
              Entered the wrong number?{" "}
              <span className="text-amber-400 font-bold hover:underline">
                Change phone number
              </span>
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
