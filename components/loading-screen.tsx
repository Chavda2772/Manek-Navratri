"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Ticket, Sparkles } from "lucide-react";

const MESSAGES = [
    "Preparing your event passes...",
    "Generating secure QR access keys...",
    "Encrypting digital pass tokens...",
    "Syncing attendee verification log...",
    "Polishing event details...",
    "Optimizing pass scanner...",
    "Validating entry permissions...",
    "Securing event ticket data...",
    "Organizing attendee roster...",
    "Preparing VIP access control...",
    "Setting up live scanner sync...",
    "Connecting to EventKey network...",
    "Configuring ticket pass tiers...",
    "Verifying entry authorization...",
    "Building your event dashboard...",
    "Loading event magic...",
];

export function LoadingScreen() {
    const [message, setMessage] = useState(MESSAGES[0]);

    useEffect(() => {
        setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

        // Rotate messages every 3 seconds
        const interval = setInterval(() => {
            setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative flex-1 min-h-[50vh] w-full flex flex-col items-center justify-center bg-background overflow-hidden py-12 my-auto select-none">
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
                {/* Premium EventKey Spinner */}
                <div className="relative w-28 h-28 mb-12 flex items-center justify-center">
                    {/* Outer slow ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-2 border-primary/10 border-t-primary/50 border-l-primary/50"
                    />

                    {/* Middle reverse ring */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2.5 rounded-full border-2 border-dashed border-primary/25"
                    />

                    {/* Inner fast ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-5 rounded-full border-t-2 border-r-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                    />

                    {/* Center pulsing core with Ticket icon */}
                    <motion.div
                        animate={{
                            scale: [0.95, 1.1, 0.95],
                            opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-10 h-10 bg-primary/15 border border-primary/40 rounded-xl flex items-center justify-center shadow-[0_0_20px_var(--primary)] backdrop-blur-xs"
                    >
                        <Ticket className="w-5 h-5 text-primary animate-pulse" />
                    </motion.div>

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
                                className="w-1.5 h-1.5 bg-primary/60 rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_8px_var(--primary)]"
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
