"use client";

import { useState } from "react";
import { useVibrantPalette } from "~/lib/usePalette";
import { InfoView } from "~/components/views/InfoView";
import { GameView } from "~/components/views/GameView";
import useGameSocket from "~/lib/useGameSocket";
import { ResultsView } from "~/components/views/ResultsView";

type AuthSession = {
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    phoneNo: bigint;
    countryCode: bigint;
    verified: boolean;
  };
};

type TabType = "info" | "game" | "results";

// TODO: Should generalize to all events next time
export default function CoffeeEvent({ session }: { session: AuthSession }) {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [isGameOver, setIsGameOver] = useState(false);
  const [snatchStartTime, setSnatchStartTime] = useState<string | null>(null);
  const palette = useVibrantPalette("/images/coffee.jpeg");
  const {
    socket,
    currentPlayerCount,
    currentPlayerId,
    players,
    setCurrentPlayerCount,
  } = useGameSocket(session);

  console.log(session);
  const handleTimeUp = (countdownDate: string) => {
    setSnatchStartTime(countdownDate);
    setActiveTab("game");
  };

  const handleGameComplete = () => {
    setIsGameOver(true);
    setActiveTab("results");
  };

  // Get available tabs based on game state
  const availableTabs = isGameOver ? ["info", "results"] : ["info", "game"];

  return (
    <main
      style={{ backgroundColor: palette.lightVibrant }}
      className="flex min-h-screen flex-col items-center gap-y-6 overflow-hidden px-4 pt-6"
    >
      {/* Tab Navigation */}
      <div className="z-20 flex w-full max-w-96 gap-2">
        {(availableTabs as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-t-lg border-2 border-b-0 border-black bg-white p-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? "text-black"
                : "text-gray-500 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Views */}
      {activeTab === "info" && (
        <InfoView palette={palette} onTimeUp={handleTimeUp} />
      )}
      {activeTab === "game" && !isGameOver && snatchStartTime && (
        <GameView
          socket={socket}
          currentPlayerCount={currentPlayerCount}
          currentPlayerId={currentPlayerId}
          players={players}
          onGameComplete={handleGameComplete}
          isGameOver={isGameOver}
          setCurrentPlayerCount={setCurrentPlayerCount}
          palette={palette}
          snatchStartTime={snatchStartTime}
        />
      )}
      {activeTab === "results" && isGameOver && (
        <ResultsView
          palette={palette}
          resultsPlayers={players}
          socket={socket}
          currentPlayerId={currentPlayerId}
        />
      )}
    </main>
  );
}
