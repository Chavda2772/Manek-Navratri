"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendRegistrationOtpAction } from "@/actions/registration.actions";
import { Phone, ArrowRight, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MobileStepClientProps {
  registrationId: string;
  event: any;
}

export function MobileStepClient({ registrationId, event }: MobileStepClientProps) {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, max 10 digits
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
      router.push(`/registration/${registrationId}/verify?phone=${encodeURIComponent(res.mobileNumber || mobileNumber)}`);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFull = event.isFull;
  const isClosed = !event.registrationEnabled || event.status !== "ACTIVE";

  return (
    <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-black text-foreground">
          Enter Your Mobile Number
        </h2>
        <p className="text-sm text-muted-foreground">
          We'll send a 6-digit verification code to verify your phone number and secure your entry pass.
        </p>
      </div>

      {isClosed ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Registration is Closed</p>
            <p className="text-xs opacity-90 mt-0.5">
              Public registration for this event is currently not accepting new responses. Please contact the organizers for more details.
            </p>
          </div>
        </div>
      ) : isFull ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Event at Capacity</p>
            <p className="text-xs opacity-90 mt-0.5">
              All spots for this event have been filled. No further registrations can be accepted at this time.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Mobile Number
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center gap-1.5 text-sm font-bold text-muted-foreground select-none pointer-events-none">
                <Phone className="w-4 h-4 text-pink-500" />
                <span>+91</span>
                <span className="text-border">|</span>
              </div>
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98765 43210"
                value={mobileNumber}
                onChange={handleMobileChange}
                disabled={loading}
                className="pl-20 h-13 text-base sm:text-lg font-bold tracking-wider rounded-2xl border-2 focus-visible:ring-pink-500/20 focus-visible:border-pink-500"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/60 flex items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>
              Your phone number is kept confidential and will only be used for entry pass validation and verification.
            </span>
          </div>

          <Button
            type="submit"
            disabled={loading || mobileNumber.length !== 10}
            className="w-full h-12.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-600/25 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending Verification Code...
              </>
            ) : (
              <>
                Send OTP & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
