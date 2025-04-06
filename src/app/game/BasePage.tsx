"use client";

import { useEffect, useState } from "react";
import { useVibrantPalette } from "~/lib/usePalette";
import { GameView } from "~/components/views/GameView";
import { GameResultsView } from "~/components/views/GameResultsView";
import { usePartySocket, type TabType } from "~/PartySocketContext";
import { GameInfoViewWrapper } from "~/components/views/GameInfoViewWrapper";

export type AuthSession = {
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

export function BasePage({ session }: { session: AuthSession }) {

  useEffect(() => {
    console.warn("BasePage mounted");
  }, []);

  // Add console warning for re-renders
  console.warn("🔄 BasePage is re-rendering");

  const palette = useVibrantPalette("/images/pokemon.jpg");
  const {
    isGameOver,
    loading,
    error,
    eventData,
    isLoading,
    players,
    activeTab,
    setActiveTab,
  } = usePartySocket();

  if (loading || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-2xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-2xl">No event data found</div>
      </div>
    );
  }

  const hasSnatchTimePassed = new Date(eventData.snatchStartTime) < new Date();

  console.log("xx isGameOver:", isGameOver);
  console.log("xx hasSnatchTimePassed:", hasSnatchTimePassed);
  console.log("xx eventData:", eventData);

  return (
    <main
      style={{
        backgroundColor: palette.lightVibrant,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        KhtmlUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
      className="flex min-h-screen flex-col items-center gap-y-6 overflow-hidden px-4 pt-6"
    >

      {/* Tab Navigation */}
      <div className="z-20 flex w-full max-w-96 gap-2">
        {["info", "game", "results"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as TabType)}
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
      {/* Show Info View */}
      {activeTab === "info" && eventData && (
        <GameInfoViewWrapper palette={palette} />
      )}
      {/* Show Game View */}
      {activeTab === "game" &&
        // !isGameOver &&
        // !hasSnatchTimePassed &&
        // eventData && 
        (
          <GameView
            palette={palette}
            snatchStartTime={new Date(eventData.snatchStartTime)}
          />
        )}
      {/* Show Results View */}
      {activeTab === "results" && eventData && (
        <GameResultsView palette={palette} resultsPlayers={players} />
      )}
    </main>
  );
}
