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
  const [countdown, setCountdown] = useState(
    initialOtpStatus?.secondsUntilResend && initialOtpStatus.secondsUntilResend > 0
      ? initialOtpStatus.secondsUntilResend
      : 30
  );
  const [isSuccess, setIsSuccess] = useState(false);

  // Security attempt limiting state
  const [maxAttempts] = useState(initialOtpStatus?.maxAttempts ?? 5);
  const [remainingAttempts, setRemainingAttempts] = useState(
    initialOtpStatus?.remainingAttempts ?? 5
  );
  const [isLocked, setIsLocked] = useState(initialOtpStatus?.isLocked ?? false);
  const [lockoutMinutes, setLockoutMinutes] = useState(
    initialOtpStatus?.lockoutMinutes ?? 15
  );
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!phone) {
      router.replace(`/registration/${registrationId}`);
    }
  }, [phone, registrationId, router]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus the first digit input on mount if not locked
  useEffect(() => {
    if (!isLocked && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isLocked]);

  const fullOtp = digits.join("");

  // Handle single digit input change
  const handleDigitChange = (index: number, value: string) => {
    if (isLocked) return;
    setError(null);

    // Only allow numbers
    const cleanVal = value.replace(/\D/g, "");

    // If pasted or multi-char in a single cell
    if (cleanVal.length > 1) {
      handlePastedCode(cleanVal);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal ? cleanVal[cleanVal.length - 1] : "";
    setDigits(newDigits);

    // Move to next input if digit was typed
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLocked) return;

    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current is empty, delete previous and move back
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

  const handlePastedCode = (pasted: string) => {
    if (isLocked) return;
    const numbersOnly = pasted.replace(/\D/g, "").slice(0, 6);
    if (!numbersOnly) return;

    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < numbersOnly.length; i++) {
      newDigits[i] = numbersOnly[i];
    }
    setDigits(newDigits);

    const nextIndex = Math.min(numbersOnly.length, 5);
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

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
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

        // Check if locked out
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

        // Update remaining attempts if provided
        if (typeof res.remainingAttempts === "number") {
          setRemainingAttempts(res.remainingAttempts);
        }

        setError(res.error || "Verification failed. Please check your code.");
        toast.error(res.error || "Verification failed");

        // Clear digits on error and refocus first cell
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

      // Cookie is already set by verifyRegistrationOtpAction server action
      setTimeout(() => {
        router.push(`/registration/${registrationId}/form`);
      }, 400);
    } catch (err: any) {
      console.error(err);
      triggerShake();
      setError("An unexpected error occurred. Please try again.");
      toast.error("Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;

    if (isLocked) {
      toast.error(
        `This number is currently locked due to failed attempts. Please wait ${lockoutMinutes} minutes.`
      );
      return;
    }

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
          if (res.lockoutMinutes) {
            setLockoutMinutes(res.lockoutMinutes);
          }
        }
        toast.error(res.error || "Failed to resend code");
        setError(res.error || "Failed to resend code");
        return;
      }

      // Reset attempt limits for the new OTP
      setIsLocked(false);
      setRemainingAttempts(maxAttempts);
      setCountdown(30);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      if (res.debugOtp) {
        toast.success(`New OTP Sent! Test Code: ${res.debugOtp}`, {
          duration: 10000,
        });
      } else {
        toast.success("New verification code sent!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network error while resending OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6"
    >
      {/* Decorative ambient background */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top action bar: Change phone number & step tag */}
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <button
          type="button"
          onClick={handleChangePhoneNumber}
          disabled={changingPhone || loading}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 group"
        >
          {changingPhone ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          )}
          <span>Change phone number</span>
        </button>

        <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
          Step 2 of 4
        </span>
      </div>

      {/* Title & mobile banner */}
      <div className="space-y-2 text-center sm:text-left relative z-10">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Verify Phone Number
        </h2>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit verification code sent to
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/80 border border-border/80 text-foreground font-mono font-bold text-xs">
            <Phone className="w-3.5 h-3.5 text-pink-500" />
            +91 {phone}
          </div>
        </div>
      </div>

      {/* Locked Out Alert Banner */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-500 space-y-2.5 shadow-md shadow-rose-500/5 relative z-10"
        >
          <div className="flex items-center gap-2 font-black text-sm text-rose-500">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Verification Locked for Security</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You have reached the maximum allowed verification attempts ({maxAttempts}/{maxAttempts}). For your security, this verification code has been deactivated.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <span className="font-semibold text-rose-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 shrink-0" /> Lockout active for ~{lockoutMinutes} min
            </span>
            <button
              type="button"
              onClick={handleChangePhoneNumber}
              className="font-bold text-foreground hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Try a different number
            </button>
          </div>
        </motion.div>
      )}

      {/* Attempts Counter Warning Banner (when attempts < max) */}
      {!isLocked && remainingAttempts < maxAttempts && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold relative z-10 ${
            remainingAttempts <= 1
              ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
              : "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {remainingAttempts === 1
                ? "Last attempt! Code will lock on next failure."
                : "Incorrect verification code entered."}
            </span>
          </div>
          <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-background/80 border border-current/20 shrink-0">
            {remainingAttempts}/{maxAttempts} left
          </span>
        </motion.div>
      )}

      <form onSubmit={handleVerify} className="space-y-6 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-pink-500" />
              <span>Enter 6-Digit Code</span>
            </label>
            <div className="flex items-center gap-3 text-xs font-mono font-bold text-muted-foreground">
              {!isLocked && (
                <span className="text-[11px] font-sans text-muted-foreground/80 hidden sm:inline">
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
                      ? "border-border/50 bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60"
                      : digit
                      ? "border-pink-500 bg-pink-500/10 text-foreground shadow-sm shadow-pink-500/20"
                      : "border-border/80 bg-background hover:border-border text-foreground"
                  } focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20`}
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
                className="text-xs font-semibold text-rose-500 flex items-center gap-1.5 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Resend OTP section with countdown */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/50 border border-border/60 text-xs">
          <span className="text-muted-foreground">Didn't receive the code?</span>
          {isLocked ? (
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-500" /> Resend locked
            </span>
          ) : countdown > 0 ? (
            <div className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
              <span>Resend code in</span>
              <span className="font-mono text-foreground font-black bg-background px-2 py-0.5 rounded-lg border border-border">
                {countdown}s
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending}
              className="font-bold text-pink-600 dark:text-pink-400 hover:text-pink-500 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
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
            className={`w-full h-13 rounded-2xl text-base font-bold text-white shadow-xl transition-all ${
              isLocked
                ? "bg-muted text-muted-foreground shadow-none cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-pink-600/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Verifying Code...
              </>
            ) : isLocked ? (
              <>
                <ShieldAlert className="w-5 h-5 mr-2 text-rose-400" />
                Verification Locked ({lockoutMinutes}m)
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-300" />
                Verified! Redirecting...
              </>
            ) : (
              <>
                Verify & Proceed to Registration
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Security badge and secondary back link */}
        <div className="space-y-3 pt-1 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Protected by rate-limiting & attempt throttling</span>
          </div>

          <div>
            <button
              type="button"
              onClick={handleChangePhoneNumber}
              disabled={changingPhone || loading}
              className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
            >
              Entered the wrong number?{" "}
              <span className="text-pink-600 dark:text-pink-400 font-bold hover:underline">
                Change phone number
              </span>
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
