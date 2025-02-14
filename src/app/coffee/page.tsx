"use client";

import { useState } from "react";
import { useVibrantPalette } from "~/lib/usePalette";
import { InfoView } from "~/components/views/InfoView";
import { GameView } from "~/components/views/GameView";
import { ResultsView } from "~/components/views/ResultsView";

type TabType = "info" | "game" | "results";

// TODO: Should generalize to all events next time
export default function CoffeeEvent() {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const palette = useVibrantPalette("/images/coffee.jpeg");

  const handleTimeUp = () => {
    setActiveTab("game");
  };

  const handleGameComplete = () => {
    setActiveTab("results");
  };

  return (
    <main
      style={{ backgroundColor: palette.lightVibrant }}
      className="flex min-h-screen flex-col items-center gap-y-6 overflow-hidden px-4 pt-6"
    >
      {/* Tab Navigation: To remove this once in prod, keep for debugging now */}
      <div className="z-20 flex w-full max-w-96 gap-2">
        {(["info", "game", "results"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-t-lg border-2 border-b-0 border-black p-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Views */}
      {activeTab === "info" && <InfoView palette={palette} onTimeUp={handleTimeUp} />}
      {activeTab === "game" && <GameView onGameComplete={handleGameComplete} />}
      {activeTab === "results" && <ResultsView palette={palette} />}
    </main>
  );
} 