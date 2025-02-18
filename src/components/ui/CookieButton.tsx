"use client";

import { useState, useCallback } from "react";
import type PartySocket from "partysocket";
import Image from "next/image";

interface CookieButtonProps {
  count: number;
  socket: PartySocket | null;
  onIncrement: (newCount: number) => void;
}

export default function CookieButton({
  count,
  socket,
  onIncrement,
}: CookieButtonProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    // Process the click immediately:
    const newCount = count + 1;
    onIncrement(newCount);
    socket?.send(JSON.stringify({ type: "counter", value: newCount }));

    // Trigger the animation if it's not already playing:
    if (!isAnimating) {
      setIsAnimating(true);
      setIsPulsing(true);

      setTimeout(() => {
        setIsPulsing(false);
        setIsAnimating(false);
      }, 200);
    }
  }, [isAnimating, count, onIncrement, socket]);

  return (
    <div className="animate-spin-slow">
      <Image
        src="/misc/cookie.svg"
        alt="Cookie"
        width={224}
        height={224}
        className={`h-56 w-56 ${isPulsing ? "animate-pulse-once" : ""}`}
        onClick={handleClick}
        style={{
          cursor: "pointer",
          filter: "drop-shadow(0 0px 10px rgba(0, 0, 0, 0.3))",
        }}
      />
    </div>
  );
}
