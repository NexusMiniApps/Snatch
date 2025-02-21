"use client";

import { useState } from "react";
import CountdownTimer from "~/components/ui/countdown";

interface CountdownDisplayProps {
  countdownDate: string;
  onTimeUp?: () => void;
  onDisplayClick?: () => void;
  variant?: "full" | "timer-only";
}

export default function CountdownDisplay({
  countdownDate,
  onTimeUp,
  onDisplayClick,
  variant = "full", // default to full display
}: CountdownDisplayProps) {
  const initialTimeIsUp = new Date(countdownDate).getTime() - Date.now() <= 0;
  const [timeIsUp, setTimeIsUp] = useState(initialTimeIsUp);

  const handleTimeUp = () => {
    setTimeIsUp(true);
    onTimeUp?.();
  };

  // Timer-only variant
  if (variant === "timer-only") {
    return (
      <button
        onClick={onDisplayClick}
        className="flex w-44 justify-center rounded-lg bg-gray-800 px-4 py-3 text-4xl font-medium text-white"
      >
        {!timeIsUp ? (
          <CountdownTimer targetDate={countdownDate} onTimeUp={handleTimeUp} />
        ) : (
          "Start!"
        )}
      </button>
    );
  }

  // Full display variant
  return (
    <section className="flex w-full max-w-96 flex-col items-center rounded-xl shadow-lg">
      <button onClick={onDisplayClick} className="custom-box w-full p-1">
        {!timeIsUp ? (
          <div className="flex w-full items-center justify-between rounded-xl bg-gray-100">
            <div className="flex flex-1 justify-center text-lg font-medium">
              Snatch! starts in
            </div>
            <div className="flex w-44 justify-center rounded-lg bg-gray-800 px-4 py-3 text-4xl font-medium text-white">
              <CountdownTimer
                targetDate={countdownDate}
                onTimeUp={handleTimeUp}
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center rounded-xl bg-gray-800 px-4 py-3 text-4xl font-medium text-white">
            Snatch!
          </div>
        )}
      </button>
    </section>
  );
}
