import { Calendar, MapPin, Sparkles, CheckCircle2 } from "lucide-react";

interface EventRegHeaderProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startDate: Date | string;
    endDate?: Date | string;
    capacity?: number;
    remainingSpots?: number;
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

      {/* Step Progress Bar */}
      <div className="bg-card/70 border border-border/80 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between relative">
          {/* Connection line behind steps */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-muted z-0" />
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300 z-0"
            style={{
              width:
                currentStep === 1
                  ? "0%"
                  : currentStep === 2
                  ? "33%"
                  : currentStep === 3
                  ? "66%"
                  : "calc(100% - 3rem)",
            }}
          />

          {steps.map((s) => {
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-gradient-to-br from-pink-600 to-purple-600 text-white ring-4 ring-pink-500/20 scale-110"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-semibold whitespace-nowrap ${
                    isCurrent
                      ? "text-foreground font-bold"
                      : isCompleted
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
