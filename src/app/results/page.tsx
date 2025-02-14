"use client";

import React from "react";
import { useRouter } from "next/navigation";
import LeaderboardTable, { Player } from "~/components/ui/LeaderboardTable";
import Image from "next/image";
import { useVibrantPalette } from "~/lib/usePalette";
import ChatUI from "~/components/Chat";

const imageSlug = "/images/coffee.jpeg";

export default function ResultsPage() {
  const router = useRouter();

  // Hardcoded final players list for testing.
  const players: Player[] = [
    { id: "John", score: 50 },
    { id: "Alice", score: 40 },
    { id: "Sasha", score: 40 },
    { id: "Tom", score: 30 },
    { id: "Julia", score: 20 },
    { id: "Peter", score: 15 },
    { id: "Mike", score: 10 },
    { id: "Eve", score: 7 },
    { id: "Lindsey", score: 30 },
    { id: "Julie", score: 20 },
    { id: "Pam", score: 15 },
    { id: "Mikey", score: 10 },
    { id: "Evee", score: 6 },
    { id: "Ethan", score: 30 },
    { id: "Julianna", score: 20 },
    { id: "Peta", score: 15 },
    { id: "Mika", score: 10 },
    { id: "Eva", score: 5 },
    // Add more players if needed.
  ];

  // Hardcoded current player's ID.
  const connectionId = "Alice";

  // Determine ranking by sorting in descending order.
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myRank = sortedPlayers.findIndex(
    (player) => player.id === connectionId,
  );

  const palette = useVibrantPalette("/images/coffee.jpeg");

  return (
    <div
      style={{
        backgroundColor: palette.lightVibrant,
      }}
      className="flex h-screen flex-col items-center gap-y-2 overflow-hidden bg-gray-50 p-4 pt-6"
    >
      <div className="custom-box z-10 flex w-full max-w-96 flex-col items-center py-4">
        {myRank >= 0 && myRank < 3 ? (
          <>
            <h1 className="z-10 text-3xl">You won the Snatch!</h1>
          </>
        ) : (
          <h1 className="text-4xl font-bold">
            Game Over! Better luck next time.
          </h1>
        )}
      </div>

      <section className="relative flex w-full max-w-96 flex-col px-2 py-2">
        <div
          style={{
            backgroundColor: palette.lightMuted,
          }}
          className="pointer-events-none absolute bottom-[-2.5rem] left-[-1.5rem] right-[-1.5rem] top-[-2.5rem] border-y-2 border-black"
        />
        <div className="z-10 flex w-full max-w-96 flex-col gap-y-4 px-2">
          <LeaderboardTable players={players} connectionId={connectionId} />
        </div>
      </section>

      <div className="custom-box z-10 flex w-full max-w-96 flex-col items-center p-2">
        <ChatUI />
      </div>

      <div className="z-10 px-2 py-2 text-sm font-light">
        Join the telegram group for more information!
      </div>
    </div>
  );
}
