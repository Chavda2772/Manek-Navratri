import { Calendar, MapPin, Sparkles, Flame } from "lucide-react";

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
  currentStep?: 1 | 2 | 3 | 4;
}

export function EventRegHeader({ event }: EventRegHeaderProps) {
  const startDateFormatted = new Date(event.startDate).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="w-full space-y-4">
      {/* Event Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3b060f]/90 via-[#260309]/95 to-[#150104]/98 border-2 border-amber-500/40 p-5 sm:p-7 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        {/* Corner Ornaments */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-400" />

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wide uppercase">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Manek Navratri Pass</span>
          </div>

          {typeof event.remainingSpots === "number" && event.remainingSpots > 0 && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {event.remainingSpots} passes available
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-400 font-serif tracking-tight">
          {event.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-amber-200/80">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-400" />
            {startDateFormatted} • 9:00 PM
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
