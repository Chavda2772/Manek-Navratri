"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  submitEventRegistrationAction,
  clearRegistrationSessionAction,
} from "@/actions/registration.actions";
import { FAMILY_RELATIONS, FamilyRelation, MAX_FAMILY_MEMBERS } from "@/lib/constants/registration";
import {
  User,
  MapPin,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

interface FamilyMemberItem {
  id: string;
  name: string;
  relation: FamilyRelation;
}

interface RegistrationFormClientProps {
  registrationId: string;
  event: any;
  verifiedPhone?: string;
  verifiedToken?: string;
}

export function RegistrationFormClient({
  registrationId,
  event,
  verifiedPhone,
  verifiedToken,
}: RegistrationFormClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use verified props from session cookie or query parameters
  const phone = verifiedPhone || searchParams.get("phone") || "";
  const token = verifiedToken || searchParams.get("token") || "";

  const [primaryName, setPrimaryName] = useState("");
  const [place, setPlace] = useState("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [changingNumber, setChangingNumber] = useState(false);
  const [errors, setErrors] = useState<{
    primaryName?: string;
    place?: string;
    family?: Record<string, string>;
  }>({});

  useEffect(() => {
    if (!phone) {
      toast.error("Please verify your phone number first");
      router.replace(`/registration/${registrationId}`);
    }
  }, [phone, registrationId, router]);

  const handleChangePhoneNumber = async () => {
    setChangingNumber(true);
    try {
      await clearRegistrationSessionAction(registrationId);
      router.push(`/registration/${registrationId}`);
    } catch {
      router.push(`/registration/${registrationId}`);
    } finally {
      setChangingNumber(false);
    }
  };

  const addFamilyMember = () => {
    if (familyMembers.length >= MAX_FAMILY_MEMBERS) {
      toast.error(`You can add up to ${MAX_FAMILY_MEMBERS} family members.`);
      return;
    }
    const newMember: FamilyMemberItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: "",
      relation: "Wife",
    };
    setFamilyMembers([...familyMembers, newMember]);
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter((m) => m.id !== id));
  };

  const updateFamilyMember = (id: string, field: "name" | "relation", value: string) => {
    setFamilyMembers(
      familyMembers.map((m) => {
        if (m.id === id) {
          return { ...m, [field]: value };
        }
        return m;
      })
    );
  };

  const validateForm = () => {
    const newErrors: {
      primaryName?: string;
      place?: string;
      family?: Record<string, string>;
    } = {};

    if (!primaryName.trim() || primaryName.trim().length < 2) {
      newErrors.primaryName = "Please enter primary attendee name.";
    }

    if (!place.trim()) {
      newErrors.place = "Please enter your place / city.";
    }

    const familyErrors: Record<string, string> = {};
    familyMembers.forEach((m) => {
      if (!m.name.trim()) {
        familyErrors[m.id] = "Name is required";
      }
    });

    if (Object.keys(familyErrors).length > 0) {
      newErrors.family = familyErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await submitEventRegistrationAction({
        registrationId,
        mobileNumber: phone,
        sessionToken: token,
        primaryName,
        place,
        familyMembers: familyMembers.map((m) => ({
          name: m.name,
          relation: m.relation,
        })),
      });

      if (!res.success) {
        if (res.alreadyRegistered && res.registrationId) {
          toast.info("This mobile number is already registered. Redirecting to your pass...");
          router.push(
            `/registration/${registrationId}/success?id=${res.registrationId}&alreadyRegistered=true`
          );
          return;
        }
        toast.error(res.error || "Failed to submit registration");
        return;
      }

      toast.success("Registration completed successfully!");
      router.push(`/registration/${registrationId}/success?id=${res.registrationId}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalPeople = 1 + familyMembers.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PRIMARY ATTENDEE CARD */}
        <div className="rounded-3xl bg-card border border-border/80 p-5 sm:p-7 shadow-xl backdrop-blur-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">
                  Primary Attendee Details
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pass will be registered in this person's name
                </p>
              </div>
            </div>

            {/* Verified badge with Change Number action */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> +91 {phone} Verified
              </span>
              <button
                type="button"
                onClick={handleChangePhoneNumber}
                disabled={changingNumber || loading}
                className="text-[11px] text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 font-bold underline cursor-pointer"
                title="Change phone number"
              >
                {changingNumber ? (
                  <Loader2 className="w-3 h-3 animate-spin inline" />
                ) : (
                  "Change"
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Name */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. Mahesh Chavda"
                  value={primaryName}
                  onChange={(e) => {
                    setPrimaryName(e.target.value);
                    if (errors.primaryName) setErrors({ ...errors, primaryName: undefined });
                  }}
                  className="h-12 text-sm font-semibold rounded-2xl border-2 focus-visible:ring-pink-500/20 focus-visible:border-pink-500"
                  autoFocus
                />
              </div>
              {errors.primaryName && (
                <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.primaryName}
                </p>
              )}
            </div>

            {/* Place / City */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                Place / City <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <MapPin className="w-4 h-4 text-purple-500" />
                </div>
                <Input
                  type="text"
                  placeholder="e.g. Ahmedabad"
                  value={place}
                  onChange={(e) => {
                    setPlace(e.target.value);
                    if (errors.place) setErrors({ ...errors, place: undefined });
                  }}
                  className="pl-10 h-12 text-sm font-semibold rounded-2xl border-2 focus-visible:ring-pink-500/20 focus-visible:border-pink-500"
                />
              </div>
              {errors.place && (
                <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.place}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FAMILY MEMBERS CARD */}
        <div className="rounded-3xl bg-card border border-border/80 p-5 sm:p-7 shadow-xl backdrop-blur-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">
                  Family Members
                </h2>
                <p className="text-xs text-muted-foreground">
                  Add up to {MAX_FAMILY_MEMBERS} additional family members
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={addFamilyMember}
              disabled={familyMembers.length >= MAX_FAMILY_MEMBERS}
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-xs bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/30 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Member ({familyMembers.length}/{MAX_FAMILY_MEMBERS})
            </Button>
          </div>

          <AnimatePresence>
            {familyMembers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 rounded-2xl bg-muted/40 border border-dashed border-border text-center space-y-2"
              >
                <p className="text-sm font-semibold text-muted-foreground">
                  No family members added yet.
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Click "+ Add Member" above if you'd like to issue family passes.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3.5">
                {familyMembers.map((member, idx) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-2xl bg-background/80 border border-border/80 space-y-3 shadow-xs hover:border-pink-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-pink-600 dark:text-pink-400 tracking-wider">
                        Family Member #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFamilyMember(member.id)}
                        className="text-xs text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7 space-y-1">
                        <Input
                          type="text"
                          placeholder="Member Full Name"
                          value={member.name}
                          onChange={(e) => updateFamilyMember(member.id, "name", e.target.value)}
                          className="h-12 text-sm font-semibold rounded-xl"
                        />
                        {errors.family?.[member.id] && (
                          <p className="text-[11px] font-semibold text-rose-500">
                            {errors.family[member.id]}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-5 space-y-1">
                        <Select
                          value={member.relation}
                          onValueChange={(val) => updateFamilyMember(member.id, "relation", val as FamilyRelation)}
                        >
                          <SelectTrigger className="h-12 rounded-xl text-sm font-semibold border bg-card">
                            <SelectValue placeholder="Relation" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl max-h-56">
                            {FAMILY_RELATIONS.map((rel) => (
                              <SelectItem key={rel} value={rel} className="text-xs font-semibold rounded-lg">
                                {rel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* SUBMIT BUTTON */}
        <motion.div whileTap={{ scale: !loading ? 0.98 : 1 }}>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl text-base font-black bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-xl shadow-pink-600/30 cursor-pointer disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Generating Event Passes...
              </>
            ) : (
              <>
                Confirm Registration • {totalPeople} {totalPeople === 1 ? "Pass" : "Passes"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
