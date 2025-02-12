"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";

interface TimeLeft {
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

interface CountdownTimerInnerProps {
    targetDate: string;
    onTimeUp?: () => void; // optional callback for when timer hits 0
}

function CountdownTimerInner({ targetDate, onTimeUp }: CountdownTimerInnerProps) {
    const calculateTimeLeft = useCallback((): TimeLeft => {
        const difference = new Date(targetDate).getTime() - new Date().getTime();
        if (difference <= 0) {
            return { hours: 0, minutes: 0, seconds: 0, total: 0 };
        }
        return {
            total: difference,
            hours: Math.floor(difference / (1000 * 60 * 60)),
            minutes: Math.floor((difference / (1000 * 60)) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            
            if (newTimeLeft.total <= 0 && onTimeUp) {
                onTimeUp();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeLeft, onTimeUp]);

    return (
        <div>
            {String(timeLeft.hours).padStart(2, "0")}:
            {String(timeLeft.minutes).padStart(2, "0")}:
            {String(timeLeft.seconds).padStart(2, "0")}
        </div>
    );
}

// Wrap with dynamic to force client-side only (no SSR)
const CountdownTimer = dynamic(() => Promise.resolve(CountdownTimerInner), {
    ssr: false,
});

export default CountdownTimer;
