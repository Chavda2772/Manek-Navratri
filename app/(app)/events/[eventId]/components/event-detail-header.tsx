"use client";

import { useState } from "react";
import { BackHeader } from "@/components/header/back-header";
import { EditEventDialog } from "./edit-event-dialog";
import { UpdateStatusDialog } from "./update-status-dialog";
import { Pencil, Activity } from "lucide-react";

interface EventDetailHeaderProps {
  event: any;
}

export function EventDetailHeader({ event }: EventDetailHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <>
      <BackHeader
        title={`Event: ${event.title}`}
        showProfile={false}
        menuItems={[
          {
            label: "Edit Event Details",
            icon: <Pencil className="w-4 h-4 text-pink-500" />,
            onClick: () => setEditOpen(true),
          },
          {
            label: "Update Status",
            icon: <Activity className="w-4 h-4 text-emerald-500" />,
            onClick: () => setStatusOpen(true),
          },
        ]}
      />

      <EditEventDialog event={event} open={editOpen} onOpenChange={setEditOpen} />
      <UpdateStatusDialog event={event} open={statusOpen} onOpenChange={setStatusOpen} />
    </>
  );
}
