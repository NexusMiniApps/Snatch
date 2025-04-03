"use client";

import LeaderboardTable from "~/components/ui/LeaderboardTable";
import { type PlayerData } from "~/components/ui/Leaderboard";
import Chat from "~/components/views/Chat";
import { usePartySocket } from "~/PartySocketContext";

interface ResultsViewProps {
  palette: {
    lightMuted: string;
    lightVibrant: string;
    darkMuted: string;
    darkVibrant: string;
    muted: string;
    vibrant: string;
  };
  resultsPlayers: PlayerData[];
}

export function ResultsView({
  palette,
  resultsPlayers,
}: ResultsViewProps) {
  const {
    currentPlayerId,
  } = usePartySocket();

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

  // Get the player's score
  const myScore =
    sortedPlayers.find((player) => player.id === connectionId)?.score ?? 0;

  // Player must be in top 5 AND have scored at least 1 point to win
  const isWinner = myRank >= 0 && myRank < 5 && myScore > 0;

  // if (loading) {
  //   return <div>Loading results...</div>;
  // }

  // if (fetchError) {
  //   return <div className="text-red-500">Error: {fetchError}</div>;
  // }

  return (
    <div className="flex max-w-full flex-col items-center gap-y-4">
      <div className="custom-box sticky top-0 z-10 flex w-full max-w-96 flex-col items-center p-1">
        <div className="flex w-full flex-col items-center justify-center rounded-lg bg-gray-900 p-3 text-white">
          {isWinner ? (
            <>
              <h1 className="z-10 text-3xl">You won the Snatch!</h1>
              <div className="mt-2 p-4 text-center text-sm">
                {/* <a
                href="https://t.me/+WHVh-EWerUIxMzZl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Join the Telegram Group for WINNERS
              </a> */}

                <a
                  href="https://t.me/+WHVh-EWerUIxMzZl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 rounded-lg bg-white px-4 py-2 text-black transition hover:bg-gray-200"
                >
                  Claim Prize
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
      </div>

      <section className="flex w-full max-w-full flex-col overflow-x-auto px-2 py-2">
        <div className="z-10 flex w-full max-w-96 flex-col gap-y-4 px-2">
          <LeaderboardTable
            // players={sortedPlayers}
            players={resultsPlayers}
            connectionId={connectionId}
          />
        </div>
      </section>

      <div className="custom-box z-10 flex w-full max-w-96 flex-col items-center">
        <Chat />
      </div>

      <section className="relative flex w-full max-w-96 flex-col">
        <div
          style={{
            backgroundColor: palette.muted,
          }}
          className="pointer-events-none absolute bottom-[-2.6rem] left-[-1.5rem] right-[-1.5rem] top-[-2.5rem] border-y-2 border-black"
        />

        <div className="custom-box z-10 mt-2 w-full items-center justify-center p-1 text-center text-sm">
          <div
            style={{
              backgroundColor: palette.lightMuted,
            }}
            className="flex w-full flex-col items-center justify-center rounded-lg"
          >
            <div className="flex w-full flex-col items-center p-4">
              <h2 className="text-xl text-black">
                Stay tuned for future events!
              </h2>
              <a
                href="https://t.me/+ZDCen5H4XCoxOTI1"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full rounded-lg border-2 border-black bg-gray-900 px-4 py-2 text-lg text-white transition hover:bg-gray-200"
              >
                Join our Telegram Group
              </a>

              <div className="mt-2 text-center text-sm">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSedDsfStaFelCNLCNinPU_MGUlvEcmpFTXpftlH78A6HZVamA/viewform?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Help us improve - Share your feedback!
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <br />
    </div>
  );
}
