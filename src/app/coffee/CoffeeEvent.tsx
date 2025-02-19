"use client";

import { useState, useEffect } from "react";
import { useVibrantPalette } from "~/lib/usePalette";
import { InfoView } from "~/components/views/InfoView";
import { GameView } from "~/components/views/GameView";
import { ResultsView } from "~/components/views/ResultsView";
import useGameSocket from "~/lib/useGameSocket";

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

type TabType = "info" | "game";

// TODO: Should generalize to all events next time
export default function CoffeeEvent({ session }: { session: AuthSession }) {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [isGameOver, setIsGameOver] = useState(false);
  const palette = useVibrantPalette("/images/coffee.jpeg");
  const {
    socket,
    currentPlayerCount,
    currentPlayerId,
    players,
    setCurrentPlayerCount,
  } = useGameSocket(session);

  console.log(session);
  const handleTimeUp = () => {
    setActiveTab("game");
  };

  const handleGameComplete = () => {
    setIsGameOver(true);
  };

  useEffect(() => {
    if (activeTab === "game" && !isGameOver) {
      const timer = setTimeout(() => {
        handleGameComplete();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [activeTab, isGameOver]);

  return (
    <main
      style={{ backgroundColor: palette.lightVibrant }}
      className="flex min-h-screen flex-col items-center gap-y-6 overflow-hidden px-4 pt-6"
    >
      {/* Tab Navigation: To remove this once in prod, keep for debugging now */}
      <div className="z-20 flex w-full max-w-96 gap-2">
        {(["info", "game"] as const).map((tab) => (
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
      {activeTab === "game" && (
        <GameView
          onGameComplete={handleGameComplete}
          socket={socket}
          currentPlayerCount={currentPlayerCount}
          currentPlayerId={currentPlayerId}
          players={players}
          setCurrentPlayerCount={setCurrentPlayerCount}
          isGameOver={isGameOver}
          palette={palette}
        />
      )}
    </main>
  );
}
