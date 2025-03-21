"use client";

import CookieButton from "~/components/ui/CookieButton";
import { Leaderboard, type PlayerData } from "~/components/ui/Leaderboard";
import type PartySocket from "partysocket";
import { ResultsView } from "~/components/views/ResultsView";
import { useState, useEffect } from "react";
import CountdownDisplay from "~/components/ui/CountdownDisplay";
import { type EventData } from "~/lib/registrationUtils";
import { ChatMessage } from "~/lib/useGameSocket";
interface GameViewProps {
  onGameComplete: () => void;
  socket: PartySocket | null;
  currentPlayerCount: number;
  currentPlayerId: string;
  players: PlayerData[];
  setCurrentPlayerCount: (count: number) => void;
  isGameOver: boolean;
  palette: { lightMuted: string };
  snatchStartTime: Date;
  eventData: EventData;
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  socialAFollowed: boolean;
  socialBFollowed: boolean;
}

export function GameView({
  messages,
  onGameComplete,
  socket,
  currentPlayerCount,
  currentPlayerId,
  players,
  setCurrentPlayerCount,
  isGameOver,
  palette,
  snatchStartTime,
  eventData,
  sendMessage,
  socialAFollowed,
  socialBFollowed
}: GameViewProps) {
  // Initialize isGameStarted based on current time vs snatch time
  const [isGameStarted, setIsGameStarted] = useState(
    new Date(snatchStartTime).getTime() <= Date.now(),
  );
  const [gameOver, setGameOver] = useState(isGameOver);
  const [gameEndTime] = useState(() => {
    const endTime = new Date(snatchStartTime);
    endTime.setSeconds(endTime.getSeconds() + 30);
    return endTime;
  });
  const [displaySeconds, setDisplaySeconds] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [postingScores, setPostingScores] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const postScoresToDatabase = async () => {
    setPostingScores(true);
    setPostError(null);
    try {
      const requests = players.map((player) =>
        fetch("/api/eventUserScores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: eventData.id,
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
      if (error instanceof Error) {
        console.error("Error posting scores:", error.message);
        setPostError(error.message);
      } else {
        console.error("An unexpected error occurred while posting scores.");
        setPostError("An unexpected error occurred.");
      }
    } finally {
      setPostingScores(false);
    }
  };

  // Auto-start game when snatch time begins
  useEffect(() => {
    const checkAndStartGame = () => {
      if (new Date(snatchStartTime).getTime() <= Date.now()) {
        setIsGameStarted(true);
      }
    };

    checkAndStartGame();
    const timer = setInterval(checkAndStartGame, 100);
    return () => clearInterval(timer);
  }, [snatchStartTime]);

  // Automatic timer update
  useEffect(() => {
    if (new Date(snatchStartTime).getTime() > Date.now()) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(
        0,
        Math.ceil((gameEndTime.getTime() - now) / 1000),
      );
      setDisplaySeconds(remaining);
    };

    // Update immediately and then every 100ms
    updateTimer();
    const timer = setInterval(updateTimer, 100);
    return () => clearInterval(timer);
  }, [snatchStartTime, gameEndTime]);

  // Game over check
  useEffect(() => {
    const checkGameOver = () => {
      const now = new Date();
      const timeDiff = gameEndTime.getTime() - now.getTime();
      if (timeDiff <= 0) {
        console.log("Game Over at:", now.toISOString());
        console.log("Time difference was:", timeDiff);
        setGameOver(true);
        onGameComplete();
        void postScoresToDatabase();
      }
    };

    const timer = setInterval(checkGameOver, 100);
    return () => clearInterval(timer);
  }, [gameEndTime, onGameComplete]);

  useEffect(() => {
    if (gameOver) {
      console.log("Switching to Results View at:", new Date().toISOString());
    }
  }, [gameOver]);

  // Check if game should be active
  useEffect(() => {
    const checkGameActive = () => {
      const now = Date.now();
      const isGameTime = new Date(snatchStartTime).getTime() <= now;
      setIsActive(isGameTime);
    };

    // Check immediately and then every 100ms
    checkGameActive();
    const timer = setInterval(checkGameActive, 100);
    return () => clearInterval(timer);
  }, [snatchStartTime]);

  return (
    <div className="flex w-full max-w-96 flex-col items-center gap-y-4">
      <div className="relative h-full w-full">
        {!gameOver ? (
          <>
            {!isGameStarted &&
              new Date(snatchStartTime).getTime() > Date.now() && (
                <div className="fixed bottom-0 left-0 right-0 top-16 z-20 flex items-center justify-center bg-white bg-opacity-30 backdrop-blur-sm">
                  <div className="flex w-full max-w-96 items-center justify-center px-4">
                    <CountdownDisplay
                      countdownDate={snatchStartTime}
                      onTimeUp={() => setIsGameStarted(true)}
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
                    new Date(snatchStartTime).getTime() <= Date.now()
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                >
                  Time Left: {displaySeconds}s
                </p>
                <CookieButton
                  count={currentPlayerCount}
                  socket={socket}
                  onIncrement={(newCount) => {
                    setCurrentPlayerCount(newCount);
                  }}
                  disabled={!isActive}
                />
                <Leaderboard
                  players={players}
                  currentPlayerId={currentPlayerId}
                />
              </div>
            </div>
          </>
        ) : (
          <ResultsView
            sendMessage={sendMessage}
            messages={messages}
            palette={{
              lightMuted: palette.lightMuted,
              lightVibrant: palette.lightMuted, // Fallback to lightMuted
              darkMuted: palette.lightMuted, // Fallback to lightMuted
              darkVibrant: palette.lightMuted, // Fallback to lightMuted
              muted: palette.lightMuted, // Fallback to lightMuted
              vibrant: palette.lightMuted, // Fallback to lightMuted
            }}
            resultsPlayers={players}
            socket={socket}
            currentPlayerId={currentPlayerId}
          />
        )}
      </div>
    </div>
  );
}
