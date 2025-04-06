"use client";

import { useState, useEffect } from "react";
import CountdownTimer from "~/components/ui/countdown";
import { usePartySocket } from "~/PartySocketContext";

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
  const { gamePhase, timeRemaining, checkSnatchStartTime } = usePartySocket();
  const [timeIsUp, setTimeIsUp] = useState(false);
  const [displayTime, setDisplayTime] = useState<number | null>(null);
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number | null>(
    null,
  );

  // Check snatch start time when component mounts
  useEffect(() => {
    void checkSnatchStartTime();
  }, [checkSnatchStartTime]);

  // Update display time based on websocket data
  useEffect(() => {
    // If we're in the active phase, use the timeRemaining from the socket
    if (gamePhase === "active") {
      setDisplayTime(timeRemaining);
      setLocalTimeRemaining(timeRemaining);
      setTimeIsUp(false);
    } else if (gamePhase === "waiting") {
      // Calculate the time left until the countdown date
      const calculateTimeLeft = () => {
        const difference = new Date(countdownDate).getTime() - Date.now();
        if (difference <= 0) {
          return 0;
        }
        return Math.ceil(difference / 1000);
      };

      const initialTimeLeft = calculateTimeLeft();
      setDisplayTime(initialTimeLeft);
      setLocalTimeRemaining(initialTimeLeft);
      setTimeIsUp(false);
    } else if (gamePhase === "gameover") {
      setDisplayTime(0);
      setLocalTimeRemaining(0);
      setTimeIsUp(true);
    }
  }, [gamePhase, timeRemaining, countdownDate]);

  // Set up a local timer to update the display time every second
  useEffect(() => {
    // Only run the timer if we're in the waiting phase and have a valid local time
    if (gamePhase !== "waiting" || localTimeRemaining === null) return;

    const timer = setInterval(() => {
      setLocalTimeRemaining((prevTime) => {
        if (prevTime === null || prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, localTimeRemaining]);

  // Update display time from local timer
  useEffect(() => {
    if (gamePhase === "waiting" && localTimeRemaining !== null) {
      setDisplayTime(localTimeRemaining);
    }
  }, [gamePhase, localTimeRemaining]);

  // Only trigger onTimeUp when the game phase changes to active
  useEffect(() => {
    if (gamePhase === "active" && onTimeUp) {
      onTimeUp();
    }
  }, [gamePhase, onTimeUp]);

  const handleTimeUp = () => {
    // Only set timeIsUp if we're not already in the active phase
    // This prevents local timing from overriding the websocket state
    if (gamePhase !== "active") {
      setTimeIsUp(true);
      onTimeUp?.();
    }
  };

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  // Timer-only variant (non-clickable)
  if (variant === "timer-only") {
    return (
      <div className="z-30 flex w-44 justify-center rounded-lg bg-gray-800 px-4 py-3 text-4xl font-medium text-white">
        {gamePhase === "gameover" ? (
          "Event ended!"
        ) : gamePhase === "active" ? (
          "Start!"
        ) : !timeIsUp ? (
          displayTime !== null ? (
            formatTime(displayTime)
          ) : (
            <CountdownTimer
              targetDate={countdownDate}
              onTimeUp={handleTimeUp}
            />
          )
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
        {gamePhase === "gameover" ? (
          <div className="flex w-full items-center justify-center rounded-xl bg-gray-800 px-4 py-3 text-4xl font-medium text-white">
            Event ended!
          </div>
        ) : gamePhase === "active" ? (
          <div className="flex w-full items-center justify-center rounded-xl bg-gray-800 px-4 py-3 text-4xl font-medium text-white">
            Snatch!
          </div>
        ) : !timeIsUp ? (
          <div className="flex w-full items-center justify-between rounded-xl bg-gray-100">
            <div className="flex flex-1 justify-center px-2 text-lg font-medium">
              Snatch! starts in
            </div>
            <div className="flex w-44 justify-center rounded-lg bg-gray-800 px-2 py-3 text-4xl font-medium text-white">
              {displayTime !== null ? (
                formatTime(displayTime)
              ) : (
                <CountdownTimer
                  targetDate={countdownDate}
                  onTimeUp={handleTimeUp}
                />
              )}
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
