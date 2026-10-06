"use client";

import { useState } from "react";
import {
  generateRegistrationLinkAction,
  regenerateRegistrationLinkAction,
  toggleRegistrationStatusAction,
} from "@/actions/registration.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeView } from "@/components/qr-code-view";
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  RotateCw,
  Loader2,
  Sparkles,
  Power,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

interface RegistrationLinkDialogProps {
  event: {
    id: string;
    title: string;
    registrationId?: string | null;
    registrationEnabled?: boolean;
    status?: string;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RegistrationLinkDialog({
  event,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: RegistrationLinkDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  const [registrationId, setRegistrationId] = useState<string | null>(
    event.registrationId || null
  );
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean>(
    Boolean(event.registrationEnabled)
  );
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = registrationId ? `${origin}/registration/${registrationId}` : "";

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateRegistrationLinkAction(event.id);
      if (!res.success) {
        toast.error(res.error || "Failed to generate link");
        return;
      }
      setRegistrationId(res.registrationId!);
      setRegistrationEnabled(true);
      toast.success("Registration link created and activated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate registration link");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Regenerating this link will invalidate the previous registration URL. Continue?")) {
      return;
    }
    setGenerating(true);
    try {
      const res = await regenerateRegistrationLinkAction(event.id);
      if (!res.success) {
        toast.error(res.error || "Failed to regenerate link");
        return;
      }
      setRegistrationId(res.registrationId!);
      toast.success("New registration link generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to regenerate registration link");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggle = async () => {
    const nextState = !registrationEnabled;
    setGenerating(true);
    try {
      const res = await toggleRegistrationStatusAction(event.id, nextState);
      if (!res.success) {
        toast.error(res.error || "Failed to update status");
        return;
      }
      setRegistrationEnabled(nextState);
      if (res.registrationId) setRegistrationId(res.registrationId);
      toast.success(nextState ? "Public registration opened!" : "Public registration paused.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle registration status");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Registration link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md rounded-3xl p-6 sm:p-7 bg-card border-border shadow-2xl">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
              <Link2 className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              Public Registration Link
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Allow attendees to self-register via phone verification and add up to 4 family members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {!registrationId ? (
            <div className="p-6 rounded-2xl bg-muted/40 border border-dashed border-border text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  No Registration Link Yet
                </h4>
                <p className="text-xs text-muted-foreground">
                  Generate a public URL for <span className="font-semibold text-foreground">{event.title}</span>.
                </p>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-xl font-bold text-xs bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white cursor-pointer"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Generate Registration Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border/80">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${registrationEnabled ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                      }`}
                  />
                  <span className="text-xs font-bold text-foreground">
                    Status: {registrationEnabled ? "Open & Accepting" : "Paused / Closed"}
                  </span>
                </div>
                <Button
                  onClick={handleToggle}
                  disabled={generating}
                  size="sm"
                  variant="outline"
                  className={`rounded-xl text-xs font-bold cursor-pointer h-8 px-3 ${registrationEnabled
                    ? "text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    : "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                    }`}
                >
                  <Power className="w-3 h-3 mr-1" />
                  {registrationEnabled ? "Pause Link" : "Activate Link"}
                </Button>
              </div>

              {/* URL Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Public URL
                </label>
                <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-muted/60 border border-border">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 bg-transparent text-xs font-mono font-medium text-foreground px-2 outline-none truncate"
                  />
                  <Button
                    onClick={handleCopy}
                    size="sm"
                    className="rounded-xl h-8 px-3 text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white cursor-pointer shadow-xs shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQr(!showQr)}
                  className="rounded-xl text-xs font-bold h-9 border bg-card hover:bg-muted cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1 text-pink-500" />
                  {showQr ? "Hide QR" : "QR Code"}
                </Button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl text-xs font-bold h-9 border bg-card hover:bg-muted text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1 text-purple-500" />
                  Visit Link
                </a>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={generating}
                  className="rounded-xl text-xs font-bold h-9 border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              </div>

              {/* QR Code Expansion */}
              {showQr && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 flex flex-col items-center justify-center space-y-3">
                  <QRCodeView
                    data={publicUrl}
                    size={180}
                    fileName={`${event.title}-registration-qr`}
                    className="bg-white p-3 rounded-2xl"
                  />
                  <p className="text-[11px] text-muted-foreground text-center">
                    Attendees can scan this QR code with their mobile phone camera to open the registration page directly.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
