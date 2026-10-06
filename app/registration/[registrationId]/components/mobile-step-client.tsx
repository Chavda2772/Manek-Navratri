"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendRegistrationOtpAction } from "@/actions/registration.actions";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface MobileStepClientProps {
  registrationId: string;
  event: any;
}

export function MobileStepClient({ registrationId, event }: MobileStepClientProps) {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidIndianNumber =
    mobileNumber.length === 10 && /^[6-9]\d{9}$/.test(mobileNumber);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(cleaned);
    if (error) setError(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mobileNumber || mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!isValidIndianNumber) {
      setError("Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await sendRegistrationOtpAction({
        registrationId,
        mobileNumber,
      });

      if (!res.success) {
        setError(res.error || "Failed to send verification code");
        toast.error(res.error || "Failed to send OTP");
        return;
      }

      if (res.debugOtp) {
        toast.success(`OTP Sent! Test Code: ${res.debugOtp}`, {
          duration: 10000,
        });
      } else {
        toast.success(res.message || "Verification code sent to your phone!");
      }

      // Redirect to OTP verification page
      router.push(
        `/registration/${registrationId}/verify?phone=${encodeURIComponent(
          res.mobileNumber || mobileNumber
        )}`
      );
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6"
    >
      {/* Decorative ambient background accents */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="space-y-2 text-center sm:text-left relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold tracking-wide mb-1 border border-pink-500/20">
          <Sparkles className="w-3.5 h-3.5" /> Step 1: Mobile Verification
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Enter Mobile Number
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Enter your 10-digit mobile number to register or access your existing pass. An OTP code will be sent to verify your identity.
        </p>
      </div>

      <form onSubmit={handleSendOtp} className="space-y-6 relative z-10">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>Mobile Number</span>
              <span className="text-rose-500">*</span>
            </label>
            {isValidIndianNumber && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for OTP
              </span>
            )}
          </div>

          <div className="relative flex items-center group">
            {/* Country code pill */}
            <div className="absolute left-3.5 flex items-center gap-2 text-sm font-black text-muted-foreground select-none pointer-events-none">
              <span className="text-base">🇮🇳</span>
              <span className="text-foreground tracking-tight">+91</span>
              <span className="text-border text-lg font-light">|</span>
            </div>

            <Input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
              placeholder="98765 43210"
              value={mobileNumber}
              onChange={handleMobileChange}
              disabled={loading}
              className={`pl-22 pr-12 h-14 text-lg sm:text-xl font-bold tracking-wider rounded-2xl border-2 transition-all duration-200 focus-visible:ring-4 focus-visible:ring-pink-500/20 focus-visible:border-pink-500 ${isValidIndianNumber
                  ? "border-pink-500/60 bg-pink-500/5"
                  : "border-border/80"
                }`}
              autoFocus
            />

            {/* End status icon */}
            <div className="absolute right-4 pointer-events-none text-muted-foreground">
              {isValidIndianNumber && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

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

        {/* Security & privacy assurance banner */}
        <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/60 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="leading-relaxed">
            Your passes and personal information are protected. Only verified OTP holders can view ticket details.
          </span>
        </div>

        {/* Action Button */}
        <motion.div whileTap={{ scale: isValidIndianNumber && !loading ? 0.98 : 1 }}>
          <Button
            type="submit"
            disabled={loading || !isValidIndianNumber}
            className="w-full h-13 rounded-2xl text-base font-bold bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-xl shadow-pink-600/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Sending Verification Code...
              </>
            ) : (
              <>
                Send OTP & Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
