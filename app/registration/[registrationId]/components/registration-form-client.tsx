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
    // If not verified with phone, redirect to Step 1
    if (!phone) {
      router.push(`/registration/${registrationId}`);
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
      toast.error(`Maximum ${MAX_FAMILY_MEMBERS} family members allowed.`);
      return;
    }
    const newMember: FamilyMemberItem = {
      id: `fam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: "",
      relation: "Other",
    };
    setFamilyMembers([...familyMembers, newMember]);
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter((m) => m.id !== id));
    if (errors.family?.[id]) {
      const updatedFamilyErrors = { ...errors.family };
      delete updatedFamilyErrors[id];
      setErrors({ ...errors, family: updatedFamilyErrors });
    }
  };

  const updateFamilyMember = (
    id: string,
    field: "name" | "relation",
    value: string
  ) => {
    setFamilyMembers(
      familyMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
    if (field === "name" && errors.family?.[id]) {
      const updatedFamilyErrors = { ...errors.family };
      delete updatedFamilyErrors[id];
      setErrors({ ...errors, family: updatedFamilyErrors });
    }
  };

  const validate = () => {
    const newErrors: {
      primaryName?: string;
      place?: string;
      family?: Record<string, string>;
    } = {};

    if (!primaryName.trim()) {
      newErrors.primaryName = "Please enter your full name.";
    } else if (primaryName.trim().length < 2) {
      newErrors.primaryName = "Name must be at least 2 characters.";
    }

    if (!place.trim()) {
      newErrors.place = "Please enter your place/city.";
    } else if (place.trim().length < 2) {
      newErrors.place = "Place must be at least 2 characters.";
    }

    const familyErrors: Record<string, string> = {};
    familyMembers.forEach((member) => {
      if (!member.name.trim()) {
        familyErrors[member.id] = "Member name is required.";
      } else if (member.name.trim().length < 2) {
        familyErrors[member.id] = "Name must be at least 2 characters.";
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

    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await submitEventRegistrationAction({
        registrationId,
        mobileNumber: phone,
        sessionToken: token,
        primaryName: primaryName.trim(),
        place: place.trim(),
        familyMembers: familyMembers.map((m) => ({
          name: m.name.trim(),
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
      className="space-y-6 text-amber-50"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PRIMARY ATTENDEE CARD */}
        <div className="rounded-3xl bg-gradient-to-b from-[#2e040b]/95 via-[#210308]/95 to-[#160205]/98 border-2 border-amber-500/40 p-5 sm:p-7 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-amber-100 font-serif">
                  Primary Attendee Details
                </h2>
                <p className="text-xs text-amber-200/70">
                  મુખ્ય ખેલૈયા / દર્શકની માહિતી (Pass will be issued under this name)
                </p>
              </div>
            </div>

            {/* Verified badge with Change Number action */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> +91 {phone} Verified
              </span>
              <button
                type="button"
                onClick={handleChangePhoneNumber}
                disabled={changingNumber || loading}
                className="text-[11px] text-amber-300 hover:text-amber-100 font-bold underline cursor-pointer"
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
              <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                Full Name <span className="text-amber-400">*</span>
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
                  className="h-12 text-sm font-semibold rounded-2xl border-2 bg-black/40 border-amber-500/30 text-amber-100 placeholder:text-amber-300/30 focus-visible:ring-4 focus-visible:ring-amber-500/20 focus-visible:border-amber-400"
                  autoFocus
                />
              </div>
              {errors.primaryName && (
                <p className="text-xs font-semibold text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.primaryName}
                </p>
              )}
            </div>

            {/* Place / City */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                Place / City <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400">
                  <MapPin className="w-4 h-4 text-amber-400" />
                </div>
                <Input
                  type="text"
                  placeholder="e.g. Dwarka / Jamnagar"
                  value={place}
                  onChange={(e) => {
                    setPlace(e.target.value);
                    if (errors.place) setErrors({ ...errors, place: undefined });
                  }}
                  className="pl-10 h-12 text-sm font-semibold rounded-2xl border-2 bg-black/40 border-amber-500/30 text-amber-100 placeholder:text-amber-300/30 focus-visible:ring-4 focus-visible:ring-amber-500/20 focus-visible:border-amber-400"
                />
              </div>
              {errors.place && (
                <p className="text-xs font-semibold text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.place}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FAMILY MEMBERS CARD */}
        <div className="rounded-3xl bg-gradient-to-b from-[#2e040b]/95 via-[#210308]/95 to-[#160205]/98 border-2 border-amber-500/40 p-5 sm:p-7 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-amber-100 font-serif">
                  Family Members
                </h2>
                <p className="text-xs text-amber-200/70">
                  પરિવારના સભ્યો ઉમેરો (Add up to {MAX_FAMILY_MEMBERS} members)
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={addFamilyMember}
              disabled={familyMembers.length >= MAX_FAMILY_MEMBERS}
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Add Member ({familyMembers.length}/{MAX_FAMILY_MEMBERS})
            </Button>
          </div>

          <AnimatePresence>
            {familyMembers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 rounded-2xl bg-black/30 border border-dashed border-amber-500/30 text-center space-y-2"
              >
                <p className="text-sm font-semibold text-amber-200/80">
                  No family members added yet.
                </p>
                <p className="text-xs text-amber-200/60">
                  જો આપ પરિવાર સાથે આવતા હોવ તો ઉપર &ldquo;+ Add Member&rdquo; બટન પર ક્લિક કરીને સભ્યો ઉમેરી શકો છો.
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
                    className="p-4 rounded-2xl bg-black/30 border border-amber-500/25 space-y-3 shadow-xs hover:border-amber-400/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                        Family Member #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFamilyMember(member.id)}
                        className="text-xs text-amber-300 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
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
                          className="h-12 text-sm font-semibold rounded-xl bg-black/40 border-amber-500/30 text-amber-100 placeholder:text-amber-300/30 focus-visible:ring-amber-500/20 focus-visible:border-amber-400"
                        />
                        {errors.family?.[member.id] && (
                          <p className="text-[11px] font-semibold text-rose-400">
                            {errors.family[member.id]}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-5 space-y-1">
                        <Select
                          value={member.relation}
                          onValueChange={(val) => updateFamilyMember(member.id, "relation", val as FamilyRelation)}
                        >
                          <SelectTrigger className="h-12 rounded-xl text-sm font-semibold border-amber-500/30 bg-black/40 text-amber-100">
                            <SelectValue placeholder="Relation" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl max-h-56 bg-[#200308] border-amber-500/30 text-amber-100">
                            {FAMILY_RELATIONS.map((rel) => (
                              <SelectItem key={rel} value={rel} className="text-xs font-semibold rounded-lg focus:bg-amber-500/20 focus:text-amber-200">
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
            className="w-full h-14 rounded-2xl text-base font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-[#2a0408] shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] border border-amber-200 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#2a0408]" />
                <span>Generating Event Passes...</span>
              </>
            ) : (
              <>
                <span>Confirm Registration • {totalPeople} {totalPeople === 1 ? "Pass" : "Passes"}</span>
                <ArrowRight className="w-5 h-5 ml-1 text-[#2a0408]" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
