"use client";

import CookieButton from "~/components/ui/CookieButton";
import { Leaderboard, type PlayerData } from "~/components/ui/Leaderboard";
import type PartySocket from "partysocket";
import { ResultsView } from "~/components/views/ResultsView";
import { useState, useEffect, useRef } from "react";
import { useTimer } from "react-timer-hook";

interface GameViewProps {
  onGameComplete: () => void;
  socket: PartySocket | null;
  currentPlayerCount: number;
  currentPlayerId: string;
  players: PlayerData[];
  setCurrentPlayerCount: (count: number) => void;
  isGameOver: boolean;
  palette: { lightMuted: string };
}

export function GameView({
  onGameComplete,
  socket,
  currentPlayerCount,
  currentPlayerId,
  players,
  setCurrentPlayerCount,
  isGameOver,
  palette,
}: GameViewProps) {
  const expiryTimestamp = new Date();
  expiryTimestamp.setSeconds(expiryTimestamp.getSeconds() + 10); // 60 seconds timer

  const { seconds, start, pause, resume, restart } = useTimer({
    expiryTimestamp,
    onExpire: onGameComplete,
  });

  useEffect(() => {
    if (!isGameOver) {
      start();
    } else {
      pause();
    }
  }, [isGameOver, start, pause]);

  return (
    <>
      {!isGameOver ? (
        <>
          <section className="custom-box z-10 h-full w-full p-1 shadow-xl">
            <div className="rounded-lg bg-yellow-950 p-4 text-white">
              <h1 className="text-3xl font-semibold">Cookie Craze</h1>
              <h1 className="pt-1 text-sm font-light">
                Tap the cookie as many times as you can!
              </h1>
            </div>
          </section>

          <div className="relative flex w-full flex-col items-center">
            <div className="pointer-events-none absolute bottom-[15rem] left-[-2rem] right-[-2rem] top-[-4rem] border-y-2 border-black bg-orange-100" />
            <div className="z-10 flex flex-col items-center justify-center">
              <p className="mb-4 text-2xl font-semibold text-yellow-950">
                Time Left: {seconds}s
              </p>
              <CookieButton
                count={currentPlayerCount}
                socket={socket}
                onIncrement={(newCount) => {
                  setCurrentPlayerCount(newCount);
                  if (newCount >= 100) onGameComplete(); // Example threshold
                }}
              />
              <Leaderboard
                players={players}
                currentPlayerId={currentPlayerId}
              />
            </div>
          </div>
        </>
      ) : (
        <ResultsView
          palette={palette}
          resultsPlayers={players}
          socket={socket}
          currentPlayerId={currentPlayerId}
        />
      )}
    </>
  );
}
