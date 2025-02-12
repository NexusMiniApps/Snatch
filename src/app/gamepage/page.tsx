"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CookieButton from "~/components/ui/CookieButton";
import useGameSocket from "~/lib/useGameSocket";
import Leaderboard from "~/components/ui/Leaderboard";

export default function GamePage() {
  // const { socket, count, connectionId, players, setCount } = useGameSocket();
  const { socket, count, setCount } = useGameSocket();
  const router = useRouter();

  // Hardcoded array of players for testing.
  const players = [
    { id: "Tom", score: 10 },
    { id: "Sasha", score: 15 },
    { id: "Julia", score: 5 },
    { id: "John", score: 8 },
    { id: "Peter", score: 12 },
    { id: "Alice", score: 14 },
  ];

  // Hardcoded current connection ID (simulating the logged-in player).
  const connectionId: string = "Alice";

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.type === "gameOver") {
        router.push("/results");
      }
    };
    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, router]);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-orange-200 overflow-hidden">

      <Leaderboard players={players} connectionId={connectionId} myScore={players.find(p => p.id === connectionId)?.score || 0} />


      <section className=" custom-box w-full h-full p-1 z-10 shadow-xl">
        <div className=" bg-yellow-950 rounded-lg p-4 text-white">
          <h1 className="text-4xl font-semibold">
            Cookie Craze
          </h1>
          <h1 className="font-light text-sm pt-1">
            Tap the cookie as many times as you can!
          </h1>
        </div>
      </section>


      <div className="relative w-full flex flex-col items-center">
        <div
          className="bg-orange-100 absolute top-[-2.5rem] bottom-[-5rem] left-[-2rem] right-[-2rem] pointer-events-none border-y-2 border-black"
        />
        <div className="flex flex-col z-10 items-center justify-center mt-4">
          <p className="p-10 text-5xl font-semibold text-yellow-950">{count}</p>
          <CookieButton
            count={count}
            socket={socket}
            onIncrement={(newCount) => setCount(newCount)}
          />
        </div>
      </div>


      {/* <p className="mt-4 text-gray-600">
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
      </div> */}


    </main>
  );
}
