"use client";

import { ExternalLink, QrCode } from "lucide-react";
import Link from "next/link";

interface PassCardProps {
    pass: any;
    setSelectedPass: (pass: any) => void;
}

export function PassCard({ pass, setSelectedPass }: PassCardProps) {
    return (
        <div
            key={pass.id}
            onClick={() => setSelectedPass(pass)}
            className="p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border hover:border-purple-500/50 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
        >
            <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground text-sm truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{pass.holderName}</span>
                    <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pass.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                            }`}
                    >
                        {pass.status}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{pass.holderEmail}</p>
                <p className="text-[11px] text-muted-foreground font-mono break-all">
                    Token: <code className="text-purple-600 dark:text-purple-300 font-semibold">{pass.token}</code>
                </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => setSelectedPass(pass)}
                    className="flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-1.5 cursor-pointer border border-border"
                >
                    <QrCode className="w-3.5 h-3.5 text-pink-500" /> Preview QR
                </button>
                <Link
                    href={`/p/${pass.token}`}
                    target="_blank"
                    className="flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1.5"
                >
                    Public Pass <ExternalLink className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
