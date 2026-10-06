"use client";

import { useState } from "react";
import { updateEventStatusAction } from "@/actions/event.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, PauseCircle, CheckCheck, Check, Loader2, Activity } from "lucide-react";
import { toast } from "sonner";

export type EventStatusType = "ACTIVE" | "ON_HOLD" | "COMPLETED";

interface UpdateStatusDialogProps {
  event: {
    id: string;
    title: string;
    status: EventStatusType | string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: Array<{
  value: EventStatusType;
  label: string;
  description: string;
  icon: any;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  badgeClass: string;
}> = [
  {
    value: "ACTIVE",
    label: "Active",
    description: "Event is live. Passes can be generated and gate scanners will approve valid tickets.",
    icon: Play,
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-500/40",
    bgColor: "bg-emerald-500/10",
    badgeClass: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    value: "ON_HOLD",
    label: "On Hold",
    description: "Event is paused. Gate check-ins and pass creation will be temporarily blocked.",
    icon: PauseCircle,
    iconColor: "text-amber-500",
    borderColor: "border-amber-500/40",
    bgColor: "bg-amber-500/10",
    badgeClass: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    description: "Event has ended. Gate check-in is stopped and the event is marked as archived.",
    icon: CheckCheck,
    iconColor: "text-purple-500",
    borderColor: "border-purple-500/40",
    bgColor: "bg-purple-500/10",
    badgeClass: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
];

export function UpdateStatusDialog({
  event,
  open,
  onOpenChange,
}: UpdateStatusDialogProps) {
  const currentStatus = (event.status || "ACTIVE") as EventStatusType;
  const [selectedStatus, setSelectedStatus] = useState<EventStatusType>(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (selectedStatus === currentStatus) {
      toast.info(`Event is already ${selectedStatus.replace("_", " ")}`);
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      const res = await updateEventStatusAction(event.id, selectedStatus);
      if (res.success) {
        toast.success(`Event status updated to ${selectedStatus.replace("_", " ")}!`);
        onOpenChange(false);
      } else {
        toast.error(res.error || "Failed to update event status");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred while updating status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 sm:p-7 bg-card border-border shadow-2xl">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              Update Event Status
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Change the current operational status for <span className="font-semibold text-foreground">{event.title}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = selectedStatus === opt.value;
            const isCurrent = currentStatus === opt.value;
            const Icon = opt.icon;

            return (
              <div
                key={opt.value}
                onClick={() => setSelectedStatus(opt.value)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isSelected
                    ? `${opt.borderColor} ${opt.bgColor} ring-2 ring-pink-500/20 shadow-sm`
                    : "border-border bg-card/60 hover:bg-muted/40 hover:border-border/80"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? opt.bgColor : "bg-muted"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${opt.iconColor}`} />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {opt.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                          Current
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? "bg-pink-600 border-pink-600 text-white shadow-xs"
                          : "border-muted-foreground/30 bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl text-xs font-bold h-10 px-4 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="rounded-xl text-xs font-bold h-10 px-5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Updating...
              </>
            ) : (
              "Save Status"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
