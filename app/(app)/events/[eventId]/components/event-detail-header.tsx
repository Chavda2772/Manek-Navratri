"use client";

import { useState } from "react";
import { BackHeader } from "@/components/header/back-header";
import { AddEditEvent } from "../../components/add-edit-event-dialog";
import { Pencil } from "lucide-react";

interface EventDetailHeaderProps {
  event: any;
}

export function EventDetailHeader({ event }: EventDetailHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <BackHeader
        title={`Event: ${event.title}`}
        showProfile={false}
        menuItems={[
          {
            label: "Edit Event & Status",
            icon: <Pencil className="w-4 h-4 text-pink-500" />,
            onClick: () => setDialogOpen(true),
          },
        ]}
      />

      <AddEditEvent event={event} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

