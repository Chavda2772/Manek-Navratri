"use client";

import { useState } from "react";
import { deleteEventRegistrationAction } from "@/actions/registration.actions";
import {
  Users,
  Search,
  MapPin,
  Phone,
  Calendar,
  Ticket,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  QrCode,
  Sparkles,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RegistrationLinkDialog } from "@/components/events/registration-link-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeView } from "@/components/qr-code-view";

interface RegistrationsClientProps {
  eventId: string;
  event: any;
  initialRegistrations: any[];
  stats: {
    totalRegistrations: number;
    totalPeople: number;
  };
}

export function RegistrationsClient({
  eventId,
  event,
  initialRegistrations,
  stats,
}: RegistrationsClientProps) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] = useState<{ token: string; name: string } | null>(null);

  const filteredRegistrations = registrations.filter((reg) => {
    const q = search.toLowerCase();
    const matchPrimary = reg.primaryName?.toLowerCase().includes(q);
    const matchMobile = reg.mobileNumber?.includes(q);
    const matchPlace = reg.place?.toLowerCase().includes(q);
    const matchFamily = reg.familyMembers?.some((m: any) =>
      m.name?.toLowerCase().includes(q)
    );
    return matchPrimary || matchMobile || matchPlace || matchFamily;
  });

  const handleDelete = async (regId: string) => {
    if (!confirm("Are you sure you want to delete this registration? Associated passes will also be deleted.")) {
      return;
    }
    setDeletingId(regId);
    try {
      const res = await deleteEventRegistrationAction(eventId, regId);
      if (!res.success) {
        toast.error(res.error || "Failed to delete registration");
        return;
      }
      setRegistrations(registrations.filter((r) => r.id !== regId));
      toast.success("Registration deleted successfully");
    } catch (err) {
      toast.error("Failed to delete registration");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search by name, phone, or place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl text-xs font-semibold bg-card"
          />
        </div>

        <div className="flex items-center gap-2">
          <RegistrationLinkDialog
            event={event}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30 cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 mr-1.5" />
                Public Registration Link
              </Button>
            }
          />
        </div>
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {search ? "No matching registrations found" : "No attendees registered yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {search
              ? "Try adjusting your search criteria to find registrations."
              : "Generate and share the public registration link to start accepting attendees and family groups."}
          </p>
          {!search && (
            <div className="pt-2">
              <RegistrationLinkDialog
                event={event}
                trigger={
                  <Button className="rounded-xl font-bold text-xs bg-pink-600 hover:bg-pink-500 text-white cursor-pointer">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Share Registration Link
                  </Button>
                }
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRegistrations.map((reg) => {
            const isExpanded = expandedId === reg.id;
            const primaryPass = reg.passes?.[0];

            return (
              <div
                key={reg.id}
                className="rounded-2xl bg-card border border-border shadow-xs hover:border-pink-500/30 transition-all overflow-hidden"
              >
                {/* Main Card Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        ID: {reg.id.slice(-8)}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {reg.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30">
                        {reg.totalMembers} {reg.totalMembers === 1 ? "Person" : "People"}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-foreground">
                        {reg.primaryName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-pink-500" /> +91 {reg.mobileNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-purple-500" /> {reg.place}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />{" "}
                          {new Date(reg.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                    {primaryPass && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPass({ token: primaryPass.token, name: reg.primaryName })}
                        className="rounded-xl text-xs font-semibold h-8.5 px-2.5 cursor-pointer"
                        title="View Gate QR Pass"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1 text-pink-500" /> QR
                      </Button>
                    )}

                    {reg.familyMembers?.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpand(reg.id)}
                        className="rounded-xl text-xs font-semibold h-8.5 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            Hide Family <ChevronUp className="w-3.5 h-3.5 ml-1" />
                          </>
                        ) : (
                          <>
                            Family ({reg.familyMembers.length}) <ChevronDown className="w-3.5 h-3.5 ml-1" />
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(reg.id)}
                      disabled={deletingId === reg.id}
                      className="rounded-xl text-xs font-semibold h-8.5 px-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete registration"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Family Members Drawer */}
                {isExpanded && reg.familyMembers?.length > 0 && (
                  <div className="bg-muted/30 border-t border-border/80 p-4 sm:p-5 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Family Members Included ({reg.familyMembers.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {reg.familyMembers.map((member: any) => (
                        <div
                          key={member.id}
                          className="p-3 rounded-xl bg-card border border-border flex items-center justify-between"
                        >
                          <span className="text-xs font-bold text-foreground">
                            {member.name}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            {member.relation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Inspection Modal */}
      <Dialog open={!!selectedPass} onOpenChange={() => setSelectedPass(null)}>
        <DialogContent className="sm:max-w-xs rounded-3xl p-6 bg-card border-border shadow-2xl text-center">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              {selectedPass?.name}'s Entry Pass
            </DialogTitle>
          </DialogHeader>
          {selectedPass && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-center">
                <QRCodeView
                  data={selectedPass.token}
                  size={190}
                  showDownload={true}
                  fileName={`${selectedPass.name}-pass`}
                  className="bg-white p-3 rounded-2xl"
                />
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                Token: {selectedPass.token}
              </p>
              <a
                href={`/p/${selectedPass.token}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline"
              >
                Open Public Pass View <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
