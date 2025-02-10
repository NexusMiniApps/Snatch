"use client";

import CookieButton from "~/components/ui/CookieButton";
import useGameSocket from "~/lib/useGameSocket";

export default function GamePage() {
  const { socket, count, connectionId, players, setCount } = useGameSocket();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">

      <h1 className="text-3xl font-bold text-blue-600">
        Cookie Clicker Ripoff Mk1
      </h1>

      <p className="mt-4 text-gray-600">
        {socket ? `Connected to socket (ID: ${connectionId})` : "Connecting..."}
      </p>

      <p className="mt-2 text-sm text-gray-500">
        Connected players: {players.length}
      </p>

      <div className="mt-2 text-xs text-gray-400">
        {players.map(player => (
          <div key={player.id} className={player.id === connectionId ? 'font-bold' : ''}>
            {player.id === connectionId ? '(You) ' : ''}{player.id}: {player.score} clicks
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center">
        <p className="mb-4 text-2xl font-bold">Count: {count}</p>
        <div className="relative flex flex-col items-center">
          <div className="flex justify-center mt-4">
            <CookieButton
              count={count}
              socket={socket}
              onIncrement={(newCount) => setCount(newCount)}
            />
          </div>
        </div>
      </div>

    </main>
  );
}
