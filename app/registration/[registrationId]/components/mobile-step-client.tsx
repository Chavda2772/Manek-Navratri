"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  sendRegistrationOtpAction,
  checkMobileRegistrationAction,
} from "@/actions/registration.actions";
import {
  Phone,
  ArrowRight,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Ticket,
  CheckCircle2,
  Users,
  QrCode,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MobileStepClientProps {
  registrationId: string;
  event: any;
}

interface ExistingRegistrationData {
  registrationId: string;
  primaryName: string;
  totalMembers: number;
  place?: string;
  familyMembers?: Array<{ name: string; relation: string }>;
  passesCount?: number;
}

export function MobileStepClient({ registrationId, event }: MobileStepClientProps) {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingMobile, setCheckingMobile] = useState(false);
  const [existingRegistration, setExistingRegistration] =
    useState<ExistingRegistrationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Real-time check when user completes typing 10 digits
  useEffect(() => {
    if (mobileNumber.length !== 10) {
      setExistingRegistration(null);
      setCheckingMobile(false);
      return;
    }

    let isMounted = true;
    setCheckingMobile(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await checkMobileRegistrationAction({
          registrationId,
          mobileNumber,
        });

        if (isMounted) {
          if (res.success && res.isRegistered && res.registrationId) {
            setExistingRegistration({
              registrationId: res.registrationId,
              primaryName: res.primaryName || "Registered Attendee",
              totalMembers: res.totalMembers || 1,
              place: res.place,
              familyMembers: res.familyMembers,
              passesCount: res.passesCount,
            });
          } else {
            setExistingRegistration(null);
          }
        }
      } catch (err) {
        console.error("Error checking mobile registration:", err);
      } finally {
        if (isMounted) {
          setCheckingMobile(false);
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [mobileNumber, registrationId]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, max 10 digits
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(cleaned);
    if (error) setError(null);
  };

  const navigateToExistingPass = (targetRegId: string) => {
    toast.info("Registration found! Showing your generated pass & QR code...");
    router.push(
      `/registration/${registrationId}/success?id=${targetRegId}&alreadyRegistered=true`
    );
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mobileNumber || mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // If we already detected an existing registration, immediately redirect to pass details
    if (existingRegistration) {
      navigateToExistingPass(existingRegistration.registrationId);
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

      // If server detected that this mobile number is already registered for this event
      if (res.alreadyRegistered && res.registrationId) {
        navigateToExistingPass(res.registrationId);
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

  const isFull = event.isFull;
  const isClosed = !event.registrationEnabled || event.status !== "ACTIVE";

  return (
    <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-black text-foreground">
          {existingRegistration
            ? "Pass Already Generated"
            : "Enter Your Mobile Number"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {existingRegistration
            ? "This mobile number is already registered for this event. Your pass and QR code details are ready below."
            : "A mobile number can register once per event. Enter your phone number to continue or retrieve your pass."}
        </p>
      </div>

      {/* Show alert banner if closed or full, but still allow pass retrieval */}
      {isClosed ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Public Registration is Closed</p>
            <p className="text-xs opacity-90 mt-0.5">
              New registrations are closed. If you already registered, enter your mobile number below to access your pass and QR code.
            </p>
          </div>
        </div>
      ) : isFull ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Event Capacity Reached</p>
            <p className="text-xs opacity-90 mt-0.5">
              All registration spots are currently filled. If you have already registered, enter your mobile number below to view your existing pass.
            </p>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSendOtp} className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Mobile Number
            </label>
            {checkingMobile && (
              <span className="text-xs text-pink-600 dark:text-pink-400 flex items-center gap-1 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking registration...
              </span>
            )}
          </div>
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
              className={`pl-20 h-13 text-base sm:text-lg font-bold tracking-wider rounded-2xl border-2 focus-visible:ring-pink-500/20 focus-visible:border-pink-500 ${
                existingRegistration
                  ? "border-emerald-500 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100"
                  : ""
              }`}
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
        </div>

        {/* ALREADY REGISTERED CARD: Display generated pass, primary attendee and members summary */}
        {existingRegistration && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-card border-2 border-emerald-500/40 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    Pass Already Issued!
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    This phone number is registered for this event.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-black border border-emerald-500/30 shrink-0">
                CONFIRMED
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-background/80 border border-emerald-500/20 space-y-2 text-xs">
              <div className="flex items-center justify-between text-foreground">
                <span className="text-muted-foreground font-medium">Primary Attendee:</span>
                <span className="font-bold text-sm text-foreground">
                  {existingRegistration.primaryName}
                </span>
              </div>

              {existingRegistration.place && (
                <div className="flex items-center justify-between text-foreground">
                  <span className="text-muted-foreground font-medium">Place / City:</span>
                  <span className="font-semibold text-foreground">
                    {existingRegistration.place}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-foreground">
                <span className="text-muted-foreground font-medium">Group Size:</span>
                <span className="font-bold text-pink-600 dark:text-pink-400">
                  {existingRegistration.totalMembers}{" "}
                  {existingRegistration.totalMembers === 1 ? "Person" : "People (Family Pass)"}
                </span>
              </div>

              {existingRegistration.familyMembers &&
                existingRegistration.familyMembers.length > 0 && (
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-muted-foreground text-[11px] block mb-1">
                      Registered Family Members:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {existingRegistration.familyMembers.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-medium border"
                        >
                          {m.name} ({m.relation})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <Button
              type="button"
              onClick={() => navigateToExistingPass(existingRegistration.registrationId)}
              className="w-full h-12 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              View Generated Pass, QR Code & Members
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Regular privacy / instruction notice */}
        {!existingRegistration && (
          <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/60 flex items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>
              Each mobile number can register once per event. Your number is protected and used strictly for entry pass verification.
            </span>
          </div>
        )}

        {/* Action Button */}
        {existingRegistration ? (
          <p className="text-center text-xs text-muted-foreground">
            Want to register a different number?{" "}
            <button
              type="button"
              onClick={() => {
                setMobileNumber("");
                setExistingRegistration(null);
              }}
              className="font-bold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer"
            >
              Clear input
            </button>
          </p>
        ) : (
          <Button
            type="submit"
            disabled={
              loading ||
              checkingMobile ||
              mobileNumber.length !== 10 ||
              (!existingRegistration && (isClosed || isFull))
            }
            className="w-full h-12.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-600/25 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : checkingMobile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Checking Registration...
              </>
            ) : (
              <>
                Send OTP & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </form>
    </div>
  );
}
