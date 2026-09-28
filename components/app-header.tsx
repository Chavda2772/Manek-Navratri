"use client";

import { tran } from "@/lib/languages/i18n";
import { useEffect, useRef, useState } from "react";
import { Header } from "./header";
import { useHeader } from "./providers/header-provider";

export function AppHeader({ title }: { title: string }) {
    const ctx = useHeader();
    const prevTitleRef = useRef<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!ctx) return;
        if (prevTitleRef.current !== title) {
            prevTitleRef.current = title;
            ctx.setHeaderConfig((prev) => ({
                ...prev,
                type: "app",
                title: tran(title),
            }));
        }
    }, [title, ctx]);

    // If inside HeaderProvider, PersistentHeader in layout handles rendering
    if (ctx) {
        return null;
    }

    if (!mounted) {
        return (
            <header className="sticky top-0 z-40 h-14 sm:h-16 flex items-center justify-between bg-background px-4 sm:px-6 border-b border-border shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    {/* Logo skeleton for mobile */}
                    <div className="h-9 w-9 rounded-xl bg-muted animate-pulse lg:hidden" />
                    {/* Title skeleton */}
                    <div className="h-6 w-24 sm:h-7 sm:w-32 bg-muted rounded-lg animate-pulse" />
                </div>
                {/* Profile skeleton */}
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted animate-pulse" />
            </header>
        );
    }

    return <Header title={tran(title)} />
}
