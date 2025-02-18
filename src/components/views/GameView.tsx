"use client";

import CookieButton from "~/components/ui/CookieButton";
import { Leaderboard, PlayerData } from "~/components/ui/Leaderboard";
import PartySocket from "partysocket";

interface GameViewProps {
  onGameComplete: () => void;
  socket: PartySocket | null;
  currentPlayerCount: number;
  currentPlayerId: string;
  players: PlayerData[];
  setCurrentPlayerCount: (count: number) => void;
}

export function GameView({ 
  onGameComplete,
  socket,
  currentPlayerCount,
  currentPlayerId,
  players,
  setCurrentPlayerCount
}: GameViewProps) {
  return (
    <>
      <Leaderboard players={players} currentPlayerId={currentPlayerId} />

      <section className="custom-box z-10 h-full w-full p-1 shadow-xl">
        <div className="rounded-lg bg-yellow-950 p-4 text-white">
          <h1 className="text-3xl font-semibold">Cookie Craze</h1>
          <h1 className="pt-1 text-sm font-light">
            Tap the cookie as many times as you can!
          </h1>
        </div>
      </section>

      <div className="relative flex w-full flex-col items-center">
        <div className="pointer-events-none absolute bottom-[-5rem] left-[-2rem] right-[-2rem] top-[-2.5rem] border-y-2 border-black bg-orange-100" />
        <div className="z-10 mt-4 flex flex-col items-center justify-center">
          <p className="p-10 text-5xl font-semibold text-yellow-950">
            {currentPlayerCount}
          </p>
          <CookieButton
            count={currentPlayerCount}
            socket={socket}
            onIncrement={(newCount) => {
              setCurrentPlayerCount(newCount);
              if (newCount >= 50) onGameComplete(); // Example threshold
            }}
          />
          <p className="mt-4 text-gray-600">
            {socket
              ? `Connected to socket (ID: ${currentPlayerId})`
              : "Connecting..."}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Connected players: {players.length}
          </p>

          <div className="mt-2 text-xs text-gray-400">
            {players.map((player) => (
              <div
                key={player.id}
                className={player.id === currentPlayerId ? "font-bold" : ""}
              >
                {player.id === currentPlayerId ? "(You) " : ""}
                {player.id}: {player.score} clicks
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 