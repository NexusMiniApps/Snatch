"use client";

import { usePartySocket } from "~/PartySocketContext";
import FullLeaderboardTable from "~/components/ui/FullLeaderboardTable";
import { useSession } from "next-auth/react";

function LeaderboardContent() {
  const { data: session } = useSession();
  const { players, currentPlayerId } = usePartySocket();

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <h1 className="text-3xl font-bold">Full Leaderboard</h1>
      <FullLeaderboardTable
        players={players}
        currentPlayerId={currentPlayerId}
      />
    </main>
  );
}

// Create a layout component that includes the SessionProvider
import { SessionProvider } from "next-auth/react";

export default function LeaderboardPage() {
  return (
    <SessionProvider>
      <LeaderboardContent />
    </SessionProvider>
  );
}
