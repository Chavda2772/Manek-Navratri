import { Calendar, MapPin, Sparkles, CheckCircle2 } from "lucide-react";

interface EventRegHeaderProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startDate: Date | string;
    endDate?: Date | string;
    capacity?: number | null;
    remainingSpots?: number | null;
  };
  currentStep: 1 | 2 | 3 | 4;
}

export function EventRegHeader({ event, currentStep }: EventRegHeaderProps) {
  const startDateFormatted = new Date(event.startDate).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const steps = [
    { num: 1, label: "Mobile" },
    { num: 2, label: "Verify OTP" },
    { num: 3, label: "Details" },
    { num: 4, label: "Passes" },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Event Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-600/15 via-purple-600/10 to-amber-500/10 border border-pink-500/20 p-5 sm:p-6 backdrop-blur-md shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-600 dark:text-pink-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Public Registration
          </div>

          {typeof event.remainingSpots === "number" && event.remainingSpots > 0 && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {event.remainingSpots} spots left
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          {event.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-pink-500" />
            {startDateFormatted}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
