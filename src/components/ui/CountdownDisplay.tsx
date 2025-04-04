"use client";

import { useState } from "react";
import CountdownTimer from "~/components/ui/countdown";

interface CountdownDisplayProps {
  countdownDate: Date;
  onTimeUp?: () => void;
  onDisplayClick?: () => void;
  variant?: "full" | "timer-only";
  hasSnatchTimeEnded?: boolean;
}

export default function CountdownDisplay({
  countdownDate,
  onTimeUp,
  onDisplayClick,
  variant = "full", // default to full display
  hasSnatchTimeEnded = false,
}: CountdownDisplayProps) {
  const initialTimeIsUp = new Date(countdownDate).getTime() - Date.now() <= 0;
  const [timeIsUp, setTimeIsUp] = useState(initialTimeIsUp);

  const handleTimeUp = () => {
    setTimeIsUp(true);
    onTimeUp?.();
  };

  // Timer-only variant (non-clickable)
  if (variant === "timer-only") {
    return (
      <div className="z-30 flex w-44 justify-center rounded-lg bg-gray-800 px-4 py-3 text-4xl font-medium text-white">
        {hasSnatchTimeEnded ? (
          "Event ended!"
        ) : !timeIsUp ? (
          <CountdownTimer targetDate={countdownDate} onTimeUp={handleTimeUp} />
        ) : (
          "Start!"
        )}
      </div>
    );
  }

  // Full display variant (clickable)
  return (
    <section className="flex w-full max-w-96 flex-col items-center rounded-xl shadow-lg">
      <button
        onClick={() => {
          onDisplayClick?.();
        }}
        className="custom-box w-full p-1"
      >
        {hasSnatchTimeEnded ? (
          <div className="flex w-full items-center justify-center rounded-xl bg-gray-800 px-4 py-3 text-4xl font-medium text-white">
            Event ended!
          </div>
        ) : !timeIsUp ? (
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
