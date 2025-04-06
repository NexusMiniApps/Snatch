"use client";

import CookieButton from "~/components/ui/CookieButton";
import { Leaderboard } from "~/components/ui/Leaderboard";
import { useState, useEffect } from "react";
import CountdownDisplay from "~/components/ui/CountdownDisplay";
import { usePartySocket } from "~/PartySocketContext";

interface GameViewProps {
  palette: { lightMuted: string };
  snatchStartTime: Date;
}

export function GameView({ snatchStartTime }: GameViewProps) {
  const {
    socket,
    currentPlayerCount,
    currentPlayerId,
    players,
    setCurrentPlayerCount,
    eventData,
    incrementScore,
    isGameOver,
    setIsGameOver,
    isGameActive,
    timeRemaining,
    gamePhase,
    checkSnatchStartTime,
    setGamePhase,
  } = usePartySocket();

  // Check snatch start time when component mounts
  useEffect(() => {
    void checkSnatchStartTime();
  }, [checkSnatchStartTime]);

  // Handle countdown completion
  const handleCountdownComplete = () => {
    if (gamePhase === "waiting") {
      setGamePhase("active");
    }
  };

  // Update time remaining every second when game is active
  useEffect(() => {
    if (gamePhase === "active" && timeRemaining > 0) {
      const timer = setInterval(() => {
        // The socket listener will handle the actual time update
        // This is just a fallback to ensure the UI updates smoothly
        if (timeRemaining <= 1) {
          setGamePhase("gameover");
          setIsGameOver(true);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gamePhase, timeRemaining, setGamePhase, setIsGameOver]);

  const postScoresToDatabase = async () => {
    try {
      const requests = players.map((player) =>
        fetch("/api/eventUserScores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: eventData?.id,
            userId: player.id,
            scoreStr: player.score.toString(),
          }),
        }),
      );

      const responses = await Promise.all(requests);

      const failedResponses = responses.filter((res) => !res.ok);
      if (failedResponses.length > 0) {
        throw new Error(
          `Failed to post scores for ${failedResponses.length} players.`,
        );
      }

      console.log("All scores successfully posted to the database.");
    } catch (error: unknown) {
      console.error("Error posting scores:", error);
    }
  };

  // Handle game over state
  useEffect(() => {
    if (isGameOver && gamePhase === "gameover") {
      console.log("Posting scores to database");
      void postScoresToDatabase();
    }
  }, [isGameOver, gamePhase]);

  // Handle cookie click to update score
  const handleCookieClick = (newCount: number) => {
    // Update the local player count
    setCurrentPlayerCount(newCount);

    // Log the score update for debugging
    console.log("Cookie clicked, updating score to:", newCount);
  };

  return (
    <div className="flex w-full max-w-96 flex-col items-center gap-y-4">
      <div className="relative h-full w-full">
        <div className="absolute left-0 top-0 z-10 h-16 w-16 bg-pink-500"></div>

        <div className="relative">
          {/* Overlay with countdown - only visible in waiting phase */}
          {gamePhase === "waiting" && (
            <div className="fixed bottom-0 left-0 right-0 top-16 z-30 flex items-center justify-center bg-white bg-opacity-30 backdrop-blur-sm transition-opacity duration-300">
              <div className="flex w-full max-w-96 items-center justify-center px-4">
                <CountdownDisplay
                  countdownDate={snatchStartTime}
                  onTimeUp={handleCountdownComplete}
                  variant="timer-only"
                />
              </div>
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
            <div className="pointer-events-none absolute bottom-[16.6rem] left-[-2rem] right-[-2rem] top-[-4rem] z-10 border-y-2 border-black bg-orange-100" />
            <div className="z-20 flex flex-col items-center justify-center">
              <p
                className={`m-4 text-2xl font-semibold transition-opacity duration-300 ${
                  gamePhase === "active" ? "opacity-100" : "opacity-0"
                }`}
              >
                Time Left: {timeRemaining}s
              </p>
              <CookieButton
                count={currentPlayerCount}
                socket={socket}
                onIncrement={handleCookieClick}
                disabled={gamePhase !== "active"}
              />
              <Leaderboard
                players={players}
                currentPlayerId={currentPlayerId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
