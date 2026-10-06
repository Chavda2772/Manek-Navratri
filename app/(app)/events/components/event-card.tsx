import Link from "next/link";
import { Calendar, Ticket, Scan, MapPin, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default function EventsCard({ evt }: { evt: any }) {
    const startDateFormatted = new Date(evt.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div
            key={evt.id}
            className="relative p-6 rounded-2xl bg-card border border-border hover:border-pink-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md cursor-pointer"
        >
            {/* Absolute overlay link to event details */}
            <Link
                href={`/events/${evt.id}`}
                className="absolute inset-0 rounded-2xl z-0"
                aria-label={`View details for ${evt.title}`}
            />

            <div className="space-y-3 relative z-10 pointer-events-none">
                <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-[11px] font-semibold">
                        <Calendar className="w-3 h-3" /> {startDateFormatted}
                    </span>
                    <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            evt.status === "ON_HOLD"
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : evt.status === "COMPLETED"
                                ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30"
                                : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        }`}
                    >
                        {evt.status === "ON_HOLD" && "ON HOLD"}
                        {evt.status === "COMPLETED" && "COMPLETED"}
                        {(!evt.status || evt.status === "ACTIVE") && "ACTIVE"}
                    </span>
                </div>

                <h3 className="text-xl font-bold text-foreground group-hover:text-pink-500 transition-colors">
                    {evt.title}
                </h3>

                {evt.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> {evt.location}
                    </p>
                )}

                {evt.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {evt.description}
                    </p>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-border space-y-3 relative z-20 pointer-events-auto">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pointer-events-none">
                    <span className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> {evt._count.passes} Passes Issued
                    </span>
                    <span className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {evt._count.checkIns} Scans
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                    <Link
                        href={`/events/${evt.id}`}
                        className="px-2 py-2 rounded-xl text-[11px] font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground text-center flex items-center justify-center gap-1 border border-border"
                    >
                        Details
                    </Link>
                    <Link
                        href={`/events/${evt.id}/passes`}
                        className="px-2 py-2 rounded-xl text-[11px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-center flex items-center justify-center gap-1"
                    >
                        <Ticket className="w-3 h-3" /> Passes
                    </Link>
                    <Link
                        href={`/events/${evt.id}/scanner`}
                        className="px-2 py-2 rounded-xl text-[11px] font-semibold bg-pink-600 hover:bg-pink-500 text-white text-center flex items-center justify-center gap-1 shadow-md shadow-pink-600/20"
                    >
                        <Scan className="w-3 h-3" /> Scan
                    </Link>
                </div>
            </div>
        </div>
    );
}
