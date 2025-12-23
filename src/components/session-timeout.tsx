"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Power, WifiOff } from "lucide-react";
import { useDataCache } from "@/context/data-cache-context";

const TIMEOUT_MS = 4 * 60 * 1000 + 30 * 1000; // 4 minutes 30 seconds

export function SessionTimeout() {
    const [isIdle, setIsIdle] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { refreshCustomers, togglePolling } = useDataCache(); // We'll use this context to pause/resume later if needed, mostly logical pause here

    const startTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setIsIdle(true);
            togglePolling(true); // Pause data fetching
        }, TIMEOUT_MS);
    };

    const handleReconnect = () => {
        setIsIdle(false);
        togglePolling(false); // Resume data fetching
        startTimer();
    };

    useEffect(() => {
        // Events to listen for activity
        const events = ["click", "mousemove", "keypress", "scroll", "touchstart"];

        // Initial setup
        startTimer();

        const handleActivity = () => {
            // Only reset timer if NOT currently idle. 
            // If idle, we wait for user to explicitly click "Re-connect" on the overlay.
            if (!isIdle) {
                startTimer();
            }
        };

        // Add listeners
        events.forEach((event) => window.addEventListener(event, handleActivity));

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach((event) => window.removeEventListener(event, handleActivity));
        };
    }, [isIdle]);

    if (!isIdle) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-6 p-8 text-center max-w-md">
                <div className="rounded-full bg-muted p-6 shadow-xl ring-1 ring-border">
                    <WifiOff className="h-12 w-12 text-muted-foreground animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Session Paused</h2>
                    <p className="text-muted-foreground">
                        To save resources, we've paused your connection due to inactivity.
                        Your work is safe.
                    </p>
                </div>
                <Button
                    size="lg"
                    onClick={handleReconnect}
                    className="min-w-[150px] font-semibold shadow-lg hover:scale-105 transition-transform"
                >
                    <Power className="mr-2 h-4 w-4" />
                    Reconnect
                </Button>
            </div>
        </div>
    );
}
