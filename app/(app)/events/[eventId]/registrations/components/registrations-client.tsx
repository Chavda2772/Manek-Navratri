"use client";

import { EventRegisteredAttendees } from "../../components/event-registered-attendees";

interface RegistrationsClientProps {
  eventId: string;
  event: any;
  initialRegistrations: any[];
  stats: {
    totalRegistrations: number;
    totalPeople: number;
    totalScans?: number;
  };
}

export function RegistrationsClient({
  eventId,
  event,
  initialRegistrations,
  stats,
}: RegistrationsClientProps) {
  return (
    <EventRegisteredAttendees
      eventId={eventId}
      event={event}
      initialRegistrations={initialRegistrations}
      stats={stats}
      showViewAllLink={false}
      title="All Registered Attendees"
    />
  );
}

