"use client";

import { useEffect, useState } from "react";
import { createEventAction, updateEventAction } from "@/actions/event.actions";
import {
  Calendar,
  CheckCheck,
  Infinity as InfinityIcon,
  Loader2,
  PauseCircle,
  Pencil,
  Play,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type EventStatusType = "ACTIVE" | "ON_HOLD" | "COMPLETED";

export interface AddEditEventProps {
  event?: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    capacity?: number | null;
    status?: EventStatusType | string;
  } | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: (event: any) => void;
  initialTab?: "details" | "status";
}

const STATUS_OPTIONS: Array<{
  value: EventStatusType;
  label: string;
  description: string;
  icon: any;
  color: string;
  badgeClass: string;
  borderClass: string;
}> = [
  {
    value: "ACTIVE",
    label: "Active",
    description: "Event is live. Passes can be issued and gate scanners will approve tickets.",
    icon: Play,
    color: "text-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    borderClass: "border-emerald-500/50 bg-emerald-500/5",
  },
  {
    value: "ON_HOLD",
    label: "On Hold",
    description: "Event is paused. Gate check-ins and pass creation will be temporarily blocked.",
    icon: PauseCircle,
    color: "text-amber-500",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    borderClass: "border-amber-500/50 bg-amber-500/5",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    description: "Event has ended. Gate check-in is stopped and event is marked as archived.",
    icon: CheckCheck,
    color: "text-purple-500",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    borderClass: "border-purple-500/50 bg-purple-500/5",
  },
];

export function AddEditEvent({
  event,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: AddEditEventProps) {
  const isEdit = Boolean(event && event.id);

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  const formatDateForInput = (dateStr: any) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const [startDate, setStartDate] = useState(formatDateForInput(event?.startDate));
  const [endDate, setEndDate] = useState(formatDateForInput(event?.endDate));
  const [capacity, setCapacity] = useState(event?.capacity ? String(event.capacity) : "");
  const [status, setStatus] = useState<EventStatusType>(
    (event?.status as EventStatusType) || "ACTIVE"
  );

  // Sync state whenever event or modal open state changes
  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title || "");
        setDescription(event.description || "");
        setLocation(event.location || "");
        setStartDate(formatDateForInput(event.startDate));
        setEndDate(formatDateForInput(event.endDate));
        setCapacity(event.capacity ? String(event.capacity) : "");
        setStatus(((event.status as EventStatusType) || "ACTIVE"));
      } else {
        setTitle("");
        setDescription("");
        setLocation("");
        setStartDate("");
        setEndDate("");
        setCapacity("");
        setStatus("ACTIVE");
      }
    }
  }, [isOpen, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) {
      toast.error("Please fill in event title, start date, and end date.");
      return;
    }

    const trimmedCap = capacity.trim();
    const finalCapacity = trimmedCap === "" ? null : Number(trimmedCap);

    if (finalCapacity !== null && (isNaN(finalCapacity) || finalCapacity < 1)) {
      toast.error("Please enter a valid capacity number or leave it blank for unlimited.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && event) {
        const res = await updateEventAction({
          id: event.id,
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startDate,
          endDate,
          capacity: finalCapacity,
          status,
        });

        if (!res.success) {
          toast.error(res.error || "Failed to update event");
          return;
        }

        toast.success(
          finalCapacity === null
            ? "Event updated with Unlimited capacity!"
            : "Event updated successfully!"
        );
        setIsOpen(false);
        if (onSuccess) onSuccess(res.event);
      } else {
        const res = await createEventAction({
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startDate,
          endDate,
          capacity: finalCapacity,
        });

        if (!res.success) {
          toast.error(res.error || "Failed to create event");
          return;
        }

        toast.success(
          finalCapacity === null
            ? "New event created with Unlimited capacity!"
            : "New event created successfully!"
        );
        setIsOpen(false);
        if (onSuccess) onSuccess(res.event);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button if not controlled and trigger provided or default create button */}
      {trigger ? (
        <span onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </span>
      ) : !isEdit && controlledOpen === undefined ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-pink-600 hover:bg-pink-500 text-white transition-all shadow-lg shadow-pink-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create New Event
        </button>
      ) : null}

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 flex items-center justify-center">
                  {isEdit ? <Pencil className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {isEdit ? "Edit Event Details & Status" : "Create New Event"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isEdit
                      ? "Update event schedule, venue, capacity, and live gate status."
                      : "Set up a new event for ticketing and attendee registrations."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Navratri Mahotsav 2026 - Day 1"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Location / Venue
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Ground, Surat, Gujarat"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* Start & End Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-xs text-foreground focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-xs text-foreground focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Capacity Input with Live Indicator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Max Capacity (Attendee Limit)
                  </label>
                  <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1">
                    {capacity.trim() === "" ? (
                      <>
                        <InfinityIcon className="w-3.5 h-3.5" /> Unlimited Capacity
                      </>
                    ) : (
                      `${capacity} Attendees Max`
                    )}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Leave blank for Unlimited"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Leave blank or empty if this event has no attendee limit (Unlimited).
                </p>
              </div>

              {/* Event Status Selector (Integrated directly in Edit mode) */}
              {isEdit && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-muted-foreground">
                      Event Gate Status
                    </label>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Controls scanner admission
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = status === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => setStatus(opt.value)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected
                              ? `${opt.borderClass} shadow-xs ring-1 ring-pink-500/30`
                              : "bg-muted/20 border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Icon className={`w-3.5 h-3.5 ${opt.color}`} />
                              {opt.label}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-pink-500" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            {opt.description.slice(0, 52)}...
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Event Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key schedule details, special instructions, rules, etc."
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer rounded-xl hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-pink-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isEdit ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Named alias exports for seamless backwards-compatibility
export { AddEditEvent as AddEditEventDialog };
export { AddEditEvent as CreateEventDialog };
export { AddEditEvent as EditEventDialog };
export { AddEditEvent as UpdateStatusDialog };
