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
  Phone,
  Lock,
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
        toast.success(`OTP Sent to WhatsApp! Test Code: ${res.debugOtp}`, {
          duration: 10000,
        });
      } else {
        toast.success(res.message || "Verification code sent to your WhatsApp!");
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
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#2e040b]/95 via-[#210308]/95 to-[#160205]/98 border-2 border-amber-500/40 p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-6 text-amber-50"
    >
      {/* Decorative corner accents */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

      {/* Decorative ambient background glows */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="space-y-2 text-center sm:text-left relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold tracking-wide mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>પગલું ૧: મોબાઇલ વેરિફિકેશન (Step 1)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-400 font-serif tracking-tight">
          Enter Mobile Number
        </h2>
        <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed font-sans">
          તમારો ૧૦ આંકડાનો મોબાઇલ નંબર દાખલ કરો. નવું રજીસ્ટ્રેશન કરવા અથવા તમારો અગાઉનો પાસ મેળવવા WhatsApp પર OTP મોકલવામાં આવશે.
        </p>
      </div>

      <form onSubmit={handleSendOtp} className="space-y-6 relative z-10">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Mobile Number</span>
              <span className="text-amber-400">*</span>
            </label>
            {isValidIndianNumber && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ready for OTP</span>
              </span>
            )}
          </div>

          <div className="relative flex items-center group">
            {/* Country code pill */}
            <div className="absolute left-3.5 flex items-center gap-2 text-sm font-black text-amber-200/90 select-none pointer-events-none z-10">
              <span className="text-base">🇮🇳</span>
              <span className="text-amber-100 font-mono tracking-tight">+91</span>
              <span className="text-amber-500/40 text-lg font-light">|</span>
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
              className={`pl-22 pr-12 h-14 text-lg sm:text-xl font-bold tracking-wider rounded-2xl border-2 transition-all duration-200 bg-black/40 text-amber-100 placeholder:text-amber-300/30 focus-visible:ring-4 focus-visible:ring-amber-500/20 focus-visible:border-amber-400 ${
                isValidIndianNumber
                  ? "border-amber-400/80 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "border-amber-500/30 hover:border-amber-500/50"
              }`}
              autoFocus
            />

            {/* End status icon */}
            <div className="absolute right-4 pointer-events-none text-muted-foreground z-10">
              {isValidIndianNumber && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
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
                className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Security & privacy assurance banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 text-xs text-amber-200/80">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="leading-relaxed">
            તમારા પાસ અને અંગત વિગતો સુરક્ષિત છે. માત્ર વેરિફાઇડ ઓટીપી ધારક જ પાસ ડાઉનલોડ અથવા જોઈ શકે છે.
          </span>
        </div>

        {/* Action Button */}
        <motion.div whileTap={{ scale: isValidIndianNumber && !loading ? 0.98 : 1 }}>
          <Button
            type="submit"
            disabled={loading || !isValidIndianNumber}
            className="w-full h-14 rounded-2xl text-base font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-[#2a0408] shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-amber-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#2a0408]" />
                <span>Sending Verification Code...</span>
              </>
            ) : (
              <>
                <span>Send OTP & Continue</span>
                <ArrowRight className="w-5 h-5 ml-1 text-[#2a0408]" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
