"use client";

import { useState } from "react";
import { BackHeader } from "@/components/header/back-header";
import { EditEventDialog } from "./edit-event-dialog";
import { Pencil, Play, PauseCircle, CheckCheck } from "lucide-react";
import { updateEventStatusAction } from "@/actions/event.actions";
import { toast } from "sonner";

interface EventDetailHeaderProps {
  event: any;
}

export function EventDetailHeader({ event }: EventDetailHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: "ACTIVE" | "ON_HOLD" | "COMPLETED") => {
    if (event.status === newStatus) {
      toast.info(`Event is already ${newStatus.replace("_", " ")}`);
      return;
    }

    setLoading(true);
    try {
      const res = await updateEventStatusAction(event.id, newStatus);
      if (res.success) {
        toast.success(`Event status updated to ${newStatus.replace("_", " ")}!`);
      } else {
        toast.error(res.error || "Failed to update event status");
      }
    } catch (err: any) {
      toast.error(err?.message || "Status update error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackHeader
        title={`Event: ${event.title}`}
        menuItems={[
          {
            label: "Edit Event Details",
            icon: <Pencil className="w-4 h-4 text-pink-500" />,
            onClick: () => setEditOpen(true),
          },
          {
            label: event.status === "ACTIVE" ? "✓ Status: Active" : "Mark as Active",
            icon: <Play className="w-4 h-4 text-emerald-500" />,
            onClick: () => handleStatusChange("ACTIVE"),
          },
          {
            label: event.status === "ON_HOLD" ? "⏸ Status: On Hold" : "Mark as On Hold",
            icon: <PauseCircle className="w-4 h-4 text-amber-500" />,
            onClick: () => handleStatusChange("ON_HOLD"),
          },
          {
            label: event.status === "COMPLETED" ? "✓ Status: Completed" : "Mark as Completed",
            icon: <CheckCheck className="w-4 h-4 text-purple-500" />,
            onClick: () => handleStatusChange("COMPLETED"),
          },
        ]}
      />
      <EditEventDialog event={event} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
