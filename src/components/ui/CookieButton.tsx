"use client";

import { useState, useCallback } from "react";
import type PartySocket from "partysocket";
import Image from "next/image";

interface CookieButtonProps {
  count: number;
  socket: PartySocket | null;
  onIncrement: (newCount: number) => void;
  disabled?: boolean;
}

export default function CookieButton({
  count,
  socket,
  onIncrement,
  disabled = false,
}: CookieButtonProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;

    // Process the click immediately:
    const newCount = count + 1;

    // Log the score update for debugging
    console.log("Sending score update:", newCount);

    // Send the socket message - the socket listener will handle updating the score
    socket?.send(JSON.stringify({ type: "counter", value: newCount }));

    // Call the onIncrement callback to update the local state
    onIncrement(newCount);

    // Trigger the animation if it's not already playing:
    if (!isAnimating) {
      setIsAnimating(true);
      setIsPulsing(true);

      setTimeout(() => {
        setIsPulsing(false);
        setIsAnimating(false);
      }, 200);
    }
  }, [isAnimating, count, socket, disabled, onIncrement]);

  return (
    <div className={`animate-spin-slow ${disabled ? "opacity-50" : ""}`}>
      <Image
        src="/misc/cookie.svg"
        alt="Cookie"
        width={224}
        height={224}
        className={`h-56 w-56 ${isPulsing ? "animate-pulse-once" : ""}`}
        onClick={handleClick}
        style={{
          cursor: disabled ? "not-allowed" : "pointer",
          filter: "drop-shadow(0 0px 10px rgba(0, 0, 0, 0.3))",
        }}
      />
    </div>
  );
}
