"use client";

import React from "react";
import LeaderboardTable, { Player } from "~/components/ui/LeaderboardTable";
import { useVibrantPalette } from "~/lib/usePalette";
import ChatUI from "~/components/Chat";

export default function ResultsPage() {
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
  const connectionId = "Eva";

  // Determine ranking by sorting in descending order.
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myRank = sortedPlayers.findIndex(
    (player) => player.id === connectionId,
  );

  const isWinner = myRank >= 0 && myRank < 3;

  const palette = useVibrantPalette("/images/coffee.jpeg");

  return (
    <div
      style={{
        backgroundColor: palette.lightVibrant,
      }}
      className="flex min-h-screen flex-col items-center gap-y-2 overflow-hidden bg-gray-50 p-4 pt-6"
    >
      <div className="custom-box z-10 flex w-full max-w-96 flex-col items-center p-4">
        {isWinner ? (
          <>
            <h1 className="z-10 text-3xl">You won the Snatch!</h1>
          </>
        ) : (
          <>
            <h1 className="text-3xl">Snatch over!</h1>
            <div>Try again next time!</div>
          </>
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
        {isWinner ? (
          <span>Join the Winners Telegram group for more information!</span>
        ) : (
          <span>Connect with the host to look out for future events!</span>
        )}
      </div>
    </div>
  );
}
