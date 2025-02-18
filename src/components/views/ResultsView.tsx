"use client";

import LeaderboardTable, {
  type Player,
} from "~/components/ui/LeaderboardTable";
import ChatUI from "~/components/Chat";

interface ResultsViewProps {
  palette: {
    lightMuted: string;
  };
}

export function ResultsView({ palette }: ResultsViewProps) {
  // Results data
  const resultsPlayers: Player[] = [
    { id: "John", score: 50 },
    { id: "Alice", score: 40 },
    { id: "Sasha", score: 40 },
    { id: "Tom", score: 30 },
    { id: "Julia", score: 20 },
    { id: "John2", score: 50 },
    { id: "Alice2", score: 40 },
    { id: "Sasha2", score: 40 },
    { id: "Tom2", score: 30 },
    { id: "Julia2", score: 20 },
  ];
  const connectionId = "Julia2";
  const sortedPlayers = [...resultsPlayers].sort((a, b) => b.score - a.score);
  const myRank = sortedPlayers.findIndex(
    (player) => player.id === connectionId,
  );
  const isWinner = myRank >= 0 && myRank < 3;

  return (
    <>
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
        <ChatUI />
      </div>

      <div className="z-10 px-2 py-2 text-sm font-light">
        {isWinner ? (
          <span>Join the Winners Telegram group for more information!</span>
        ) : (
          <span>Connect with the host to look out for future events!</span>
        )}
      </div>
    </>
  );
}
