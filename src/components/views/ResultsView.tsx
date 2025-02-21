"use client";

import LeaderboardTable from "~/components/ui/LeaderboardTable";
import { PlayerData } from "@/lib/useGameSocket";
import Chat from "~/components/Chat";
import type PartySocket from "partysocket";

interface ResultsViewProps {
  palette: {
    lightMuted: string;
  };
  resultsPlayers: PlayerData[];
  socket: PartySocket | null;
  currentPlayerId: string;
}

export function ResultsView({
  palette,
  resultsPlayers,
  socket,
  currentPlayerId,
}: ResultsViewProps) {
  const connectionId = "Eva";
  const sortedPlayers = [...resultsPlayers].sort((a, b) => b.score - a.score);
  const myRank = sortedPlayers.findIndex(
    (player) => player.id === connectionId,
  );
  const isWinner = myRank >= 0 && myRank < 3;

  return (
    <div className="flex flex-col items-center gap-y-4">
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
          <LeaderboardTable
            players={resultsPlayers}
            connectionId={connectionId}
          />
        </div>
      </section>

      <div className="custom-box z-10 flex w-full max-w-96 flex-col items-center p-2">
        <Chat socket={socket} currentPlayerId={currentPlayerId} />
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
