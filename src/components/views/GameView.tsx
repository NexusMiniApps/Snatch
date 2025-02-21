"use client";

import CookieButton from "~/components/ui/CookieButton";
import { Leaderboard, type PlayerData } from "~/components/ui/Leaderboard";
import type PartySocket from "partysocket";
import { ResultsView } from "~/components/views/ResultsView";
import { useState, useEffect } from "react";
import { useTimer } from "react-timer-hook";
import { EventData } from "~/app/coffee/CoffeeEvent";

interface GameViewProps {
  onGameComplete: () => void;
  socket: PartySocket | null;
  currentPlayerCount: number;
  currentPlayerId: string;
  players: PlayerData[];
  setCurrentPlayerCount: (count: number) => void;
  isGameOver: boolean;
  palette: { lightMuted: string };
  eventData: EventData;
}

export function GameView({
  onGameComplete,
  socket,
  currentPlayerCount,
  currentPlayerId,
  players,
  setCurrentPlayerCount,
  isGameOver,
  palette,
  eventData,
}: GameViewProps) {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(isGameOver);
  const [expiryTimestamp, setExpiryTimestamp] = useState<Date | null>(null);
  const [postingScores, setPostingScores] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const eventSnatchStartTime = eventData.snatchStartTime;
  console.log("eventSnatchStartTime", eventSnatchStartTime);

  const eventId = eventData.id;

  const { seconds, start, pause, restart } = useTimer({
    expiryTimestamp: expiryTimestamp ?? new Date(),
    onExpire: () => {
      setGameOver(true);
      onGameComplete();
    },
    autoStart: false,
  });

  useEffect(() => {
    if (isGameStarted && !gameOver && expiryTimestamp) {
      restart(expiryTimestamp);
    } else {
      pause();
    }
  }, [isGameStarted, gameOver, expiryTimestamp, restart, pause]);

  const handleStartGame = () => {
    setIsGameStarted(true);
    const newExpiryTimestamp = new Date();
    newExpiryTimestamp.setSeconds(newExpiryTimestamp.getSeconds() + 10);
    setExpiryTimestamp(newExpiryTimestamp);
  };

  // const postScoresToDatabase = async () => {
  //   setPostingScores(true);
  //   setPostError(null);
  //   try {
  //     const requests = players.map((player) =>
  //       fetch("/api/eventUserScores", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           eventId,
  //           userId: player.id,
  //           score: player.score,
  //         }),
  //       })
  //     );

  //     const responses = await Promise.all(requests);

  //     const failedResponses = responses.filter((res) => !res.ok);
  //     if (failedResponses.length > 0) {
  //       throw new Error(`Failed to post scores for ${failedResponses.length} players.`);
  //     }

  //     console.log("All scores successfully posted to the database.");
  //   } catch (error: unknown) {
  //     if (error instanceof Error) {
  //       console.error("Error posting scores:", error.message);
  //       setPostError(error.message);
  //     } else {
  //       console.error("An unexpected error occurred while posting scores.");
  //       setPostError("An unexpected error occurred.");
  //     }
  //   } finally {
  //     setPostingScores(false);
  //   }
  // };

  useEffect(() => {
    if (gameOver) {
      // postScoresToDatabase();
    }
  }, [gameOver]);

  return (
    <div className="relative h-full w-full">
      {!gameOver ? (
        <>
          {!isGameStarted && (
            <div className="fixed bottom-0 left-0 right-0 top-16 z-20 z-50 flex items-center justify-center bg-white bg-opacity-30 backdrop-blur-sm">
              <button
                onClick={handleStartGame}
                className="rounded-lg bg-yellow-950 px-4 py-2 text-white shadow-lg"
              >
                Start Game
              </button>
            </div>
          )}
          <section className="custom-box relative z-20 h-full w-full p-1 shadow-xl">
            <div className="rounded-lg bg-yellow-950 p-4 text-white">
              <h1 className="text-3xl font-semibold">Cookie Craze</h1>
              <h1 className="pt-1 text-sm font-light">
                Tap the cookie as many times as you can!
              </h1>
            </div>
          </section>

          <div className="relative flex w-full flex-col items-center">
            <div className="pointer-events-none absolute bottom-[15rem] left-[-2rem] right-[-2rem] top-[-4rem] z-10 border-y-2 border-black bg-orange-100" />
            <div className="z-20 flex flex-col items-center justify-center">
              <p className="m-4 text-2xl font-semibold">
                Time Left: {seconds}s
              </p>
              <CookieButton
                count={currentPlayerCount}
                socket={socket}
                onIncrement={(newCount) => {
                  setCurrentPlayerCount(newCount);
                  if (newCount >= 100) onGameComplete(); // Example threshold
                }}
              />
              <Leaderboard
                players={players}
                currentPlayerId={currentPlayerId}
              />
            </div>
          </div>
        </>
      ) : (
        <div>
          {postingScores && <div>Posting scores to the database...</div>}
          {postError && <div className="text-red-500">Error: {postError}</div>}
          {!postingScores && !postError && (
            <ResultsView
              palette={palette}
              resultsPlayers={players}
              socket={socket}
              currentPlayerId={currentPlayerId}
              // eventId={eventId}
            />
          )}
        </div>
      )}
    </div>
  );
}
