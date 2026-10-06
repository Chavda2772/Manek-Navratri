"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyRegistrationOtpAction, sendRegistrationOtpAction } from "@/actions/registration.actions";
import { ArrowRight, ArrowLeft, Loader2, KeyRound, RotateCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VerifyStepClientProps {
  registrationId: string;
  event: any;
}

export function VerifyStepClient({ registrationId, event }: VerifyStepClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!phoneParam) {
      router.replace(`/registration/${registrationId}`);
      return;
    }
  }, [phoneParam, registrationId, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(cleaned);
    if (error) setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyRegistrationOtpAction({
        registrationId,
        mobileNumber: phoneParam,
        otp,
      });

      if (!res.success) {
        setError(res.error || "Verification failed");
        toast.error(res.error || "Verification failed");
        return;
      }

      if (res.alreadyRegistered && res.registrationId) {
        toast.info("Registration found for this mobile number! Showing your pass...");
        router.push(
          `/registration/${registrationId}/success?id=${res.registrationId}&alreadyRegistered=true`
        );
        return;
      }

      toast.success("Phone number verified successfully!");

      // Redirect to registration form with phone and session token
      router.push(
        `/registration/${registrationId}/form?phone=${encodeURIComponent(phoneParam)}&token=${encodeURIComponent(
          res.sessionToken!
        )}`
      );
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setError(null);

    try {
      const res = await sendRegistrationOtpAction({
        registrationId,
        mobileNumber: phoneParam,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to resend code");
        return;
      }

      if (res.alreadyRegistered && res.registrationId) {
        toast.info("Registration already exists for this number! Showing your pass...");
        router.push(
          `/registration/${registrationId}/success?id=${res.registrationId}&alreadyRegistered=true`
        );
        return;
      }

      setCountdown(30);
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
    <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/registration/${registrationId}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Change Phone Number
          </button>
          <span className="text-xs font-bold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
            Step 2 of 4
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-foreground pt-1">
          Verify Phone Number
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to{" "}
          <span className="font-bold text-foreground font-mono">
            +91 {phoneParam}
          </span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>6-Digit Verification Code</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              {otp.length}/6 digits
            </span>
          </label>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <KeyRound className="w-5 h-5 text-pink-500" />
            </div>
            <Input
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              value={otp}
              onChange={handleOtpChange}
              disabled={loading}
              className="pl-12 h-14 text-center text-2xl sm:text-3xl font-mono font-black tracking-[0.5em] rounded-2xl border-2 focus-visible:ring-pink-500/20 focus-visible:border-pink-500"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-500 flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
        </div>

        {/* Resend Timer / Button */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-muted-foreground">Didn't receive the code?</span>
          {countdown > 0 ? (
            <span className="text-muted-foreground font-semibold">
              Resend code in <span className="font-mono text-foreground font-bold">{countdown}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending}
              className="font-bold text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
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

        <Button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full h-12.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-600/25 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Verifying Code...
            </>
          ) : (
            <>
              Verify & Proceed to Registration
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
