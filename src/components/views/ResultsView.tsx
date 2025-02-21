"use client";

import LeaderboardTable from "~/components/ui/LeaderboardTable";
import { type PlayerData } from "~/components/ui/Leaderboard";
import Chat from "~/components/Chat";
import type PartySocket from "partysocket";
import { useState, useEffect } from "react";

interface ResultsViewProps {
  palette: {
    lightMuted: string;
  };
  resultsPlayers: PlayerData[];
  socket: PartySocket | null;
  currentPlayerId: string;
  // eventId: string;
}

export function ResultsView({
  palette,
  resultsPlayers,
  socket,
  currentPlayerId,
  // eventId,
}: ResultsViewProps) {
  // const [fetchedPlayers, setFetchedPlayers] = useState<PlayerData[]>([]);
  // const [loading, setLoading] = useState<boolean>(true);
  // const [fetchError, setFetchError] = useState<string | null>(null);

  const connectionId = currentPlayerId;

  // useEffect(() => {
  //   async function fetchScores() {
  //     setLoading(true);
  //     setFetchError(null);
  //     try {
  //       const res = await fetch(`/api/eventUserScores/${eventId}`);
  //       if (!res.ok) {
  //         const errorData = await res.json();
  //         throw new Error(errorData.error || 'Failed to fetch top scores');
  //       }
  //       const data: PlayerData[] = await res.json();
  //       setFetchedPlayers(data);
  //       console.log("Fetched top scores:", data);
  //     } catch (error: unknown) {
  //       if (error instanceof Error) {
  //         console.error("Error fetching top scores:", error.message);
  //         setFetchError(error.message);
  //       } else {
  //         console.error("An unexpected error occurred");
  //         setFetchError("An unexpected error occurred");
  //       }
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   fetchScores();
  // }, [eventId]);

  // const sortedPlayers = [...fetchedPlayers].sort((a, b) => b.score - a.score);
  // const connectionId = "930df21f-87cd-4a34-a5a3-4a78855fd075";
  const sortedPlayers = [...resultsPlayers].sort((a, b) => b.score - a.score);

  const myRank = sortedPlayers.findIndex(
    (player) => player.id === connectionId,
  );
  const isWinner = myRank >= 0 && myRank < 3;

  // if (loading) {
  //   return <div>Loading results...</div>;
  // }

  // if (fetchError) {
  //   return <div className="text-red-500">Error: {fetchError}</div>;
  // }

  return (
    <div className="flex flex-col items-center gap-y-4">
      <div className="custom-box z-10 flex w-full max-w-96 flex-col items-center p-4">
        {isWinner ? (
          <>
            <h1 className="z-10 text-3xl">You won the Snatch!</h1>
            <div className="text-center text-sm mt-2">
              <a 
                href="https://t.me/+WHVh-EWerUIxMzZl" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 underline"
              >
                Join the Telegram Group for WINNERS
              </a>
            </div>
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
            // players={sortedPlayers}
            players={resultsPlayers}
            connectionId={connectionId}
          />
        </div>
      </section>

      <div className="custom-box z-10 flex w-full max-w-96 flex-col items-center">
        <Chat socket={socket} currentPlayerId={currentPlayerId} />
      </div>

      <div className="text-center text-sm mt-2">
        <div className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg shadow-md w-full max-w-xs bg-white">
          <h2 className="text-lg">
            Stay tuned for future events!</h2>
          <a 
            href="https://t.me/+ZDCen5H4XCoxOTI1"
            target="_blank" 
            rel="noopener noreferrer" 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Join Group
          </a>
        </div>
      </div>

      {/* <div className="z-10 px-2 text-sm">
        <a
          href="https://t.me/+ZDCen5H4XCoxOTI1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Join our Telegram Group to stay tuned for future events!
        </a>
      </div> */}

      <div className="z-10 px-2 text-sm">
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSedDsfStaFelCNLCNinPU_MGUlvEcmpFTXpftlH78A6HZVamA/viewform?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Help us improve - Share your feedback!
        </a>
      </div>
      <br />
    </div>
  );
}
