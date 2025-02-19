"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

interface CountdownTimerInnerProps {
  targetDate: string;
  onTimeUp?: () => void; // optional callback for when timer hits 0
}

function CountdownTimerInner({
  targetDate,
  onTimeUp,
}: CountdownTimerInnerProps) {
  const calculateTimeLeft = () => {
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const remaining = new Date(targetDate).getTime() - Date.now();
    const intervalDelay = remaining < 2000 ? 100 : 1000;

    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);

      // If the difference is 0, call the parent callback
      if (
        newTime.hours === 0 &&
        newTime.minutes === 0 &&
        newTime.seconds === 0
      ) {
        // Stop the timer and call onTimeUp
        clearInterval(timer);
        onTimeUp?.();
      }
    }, intervalDelay);

    return () => clearInterval(timer);
  }, [onTimeUp]);

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
