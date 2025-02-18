"use client";

import CookieButton from "~/components/ui/CookieButton";
import { Leaderboard } from "~/components/ui/Leaderboard";
import useGameSocket from "~/lib/useGameSocket";

interface GameViewProps {
  onGameComplete: () => void;
}

export function GameView({ onGameComplete }: GameViewProps) {
  const {
    socket,
    currentPlayerCount,
    currentPlayerId,
    players,
    setCurrentPlayerCount,
  } = useGameSocket();

  return (
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
          {/* <p className="p-4 text-5xl font-semibold text-yellow-950">
            {currentPlayerCount}
          </p> */}
          <CookieButton
            count={currentPlayerCount}
            socket={socket}
            onIncrement={(newCount) => {
              setCurrentPlayerCount(newCount);
              if (newCount >= 100) onGameComplete(); // Example threshold
            }}
          />
          {/* <p className="mt-4 text-gray-600">
            {socket
              ? `Connected to socket (ID: ${currentPlayerId})`
              : "Connecting..."}
          </p> */}

          {/* <p className="mt-10 text-sm text-gray-500">
            Connected players: {players.length}
          </p> */}

          <Leaderboard players={players} currentPlayerId={currentPlayerId} />

          {/* <div className="mt-2 text-xs text-gray-400">
            {players.map((player) => (
              <div
                key={player.id}
                className={player.id === currentPlayerId ? "font-bold" : ""}
              >
                {player.id === currentPlayerId ? "(You) " : ""}
                {player.id}: {player.score} clicks
              </div>
            ))}
          </div> */}
        </div>
      </div>
    </>
  );
}
