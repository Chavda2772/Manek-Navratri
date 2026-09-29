"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const MESSAGES = [
    "Calculating your financial peace...",
    "Organizing the chaos...",
    "Polishing your balance sheet...",
    "Settling the scores...",
    "Securing your data with love...",
    "Dreaming of debt-free days...",
    "Syncing with the universe...",
    "Building your financial future...",
    "Counting the pennies...",
    "Optimizing your workflow...",
    "Preparing your dashboard...",
    "Gathering insights...",
    "Making things pretty...",
    "Almost there...",
    "Just a few more adjustments...",
    "Loading the magic...",
];

export function LoadingScreen() {
    const [message, setMessage] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

        // Rotate messages every 3 seconds
        const interval = setInterval(() => {
            setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-background overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, -30, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]"
                />
            </div>

            <div className="relative flex flex-col items-center max-w-xs w-full px-6">
                {/* Premium Spinner */}
                <div className="relative w-24 h-24 mb-16 flex items-center justify-center">
                    {/* Outer slow ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-2 border-primary/10 border-t-primary/40 border-l-primary/40"
                    />

                    {/* Middle reverse ring */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border-2 border-dashed border-primary/20"
                    />

                    {/* Inner fast ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 rounded-full border-t-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                    />

                    {/* Center pulsing core */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_var(--primary)]"
                    />

                    {/* Orbiting particles */}
                    {[0, 120, 240].map((angle, i) => (
                        <motion.div
                            key={i}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                            className="absolute -inset-3"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-1.5 h-1.5 bg-primary/40 rounded-full absolute top-0 left-1/2 -translate-x-1/2"
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Text Area */}
                <div className="h-12 flex items-center justify-center mb-8 px-4 w-64">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={message}
                            initial={{ y: 10, opacity: 0, filter: "blur(5px)" }}
                            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                            exit={{ y: -10, opacity: 0, filter: "blur(5px)" }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="text-center text-sm font-black uppercase tracking-widest text-foreground/80"
                        >
                            {message}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Modern Progress Track */}
                <div className="relative w-full h-1 bg-muted/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute top-0 bottom-0 w-1/2 bg-linear-to-r from-transparent via-primary/50 to-transparent"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 flex flex-col items-center gap-1.5"
                >
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/60">
                        Initializing
                    </span>
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                className="w-1 h-1 rounded-full bg-primary"
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
