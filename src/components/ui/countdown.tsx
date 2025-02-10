"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

function CountdownTimerInner({ targetDate }: { targetDate: string }) {
    const calculateTimeLeft = () => {
        const difference = new Date(targetDate).getTime() - new Date().getTime();
        if (difference <= 0) return { hours: 0, minutes: 0, seconds: 0 };
        return {
            hours: Math.floor(difference / (1000 * 60 * 60)),
            minutes: Math.floor((difference / (1000 * 60)) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div>
            {String(timeLeft.hours).padStart(2, "0")}:
            {String(timeLeft.minutes).padStart(2, "0")}:
            {String(timeLeft.seconds).padStart(2, "0")}
        </div>
    );
}

const CountdownTimer = dynamic(() => Promise.resolve(CountdownTimerInner), {
    ssr: false,
});

export default CountdownTimer;
