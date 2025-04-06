"use client";

import { useEffect, useState, useRef } from "react";
import { useVibrantPalette } from "~/lib/usePalette";
import { GameInfoView } from "~/components/views/GameInfoView";
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
  // Track if the component has been mounted
  const [hasMounted, setHasMounted] = useState(false);
  // Track if initial tab has been set
  const initialTabSetRef = useRef(false);
  // Track if we're in the initial render phase
  const isInitialRenderRef = useRef(true);

  useEffect(() => {
    console.warn("BasePage mounted");
    setHasMounted(true);

    // Set a timeout to mark the initial render phase as complete
    const timer = setTimeout(() => {
      isInitialRenderRef.current = false;
      console.log("Initial render phase complete");
    }, 1000);

    return () => clearTimeout(timer);
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
    gamePhase,
    checkSnatchStartTime,
  } = usePartySocket();

  // Determine initial active tab based on game state
  useEffect(() => {
    if (!eventData) return;

    const snatchStartTime = new Date(eventData.snatchStartTime).getTime();
    const now = Date.now();
    const gameDuration = 60000; // 1 minute in milliseconds
    const tenSecondsInMs = 10000;

    // Check if snatch will be active within the next 10 seconds
    const isSnatchStartingSoon =
      now >= snatchStartTime - tenSecondsInMs && now < snatchStartTime;

    // Check if snatch is currently active
    const isSnatchActive =
      now >= snatchStartTime && now < snatchStartTime + gameDuration;

    // Check if game is over
    const isGameOver = now >= snatchStartTime + gameDuration;

    // Set initial active tab based on game state
    if (isSnatchStartingSoon || isSnatchActive) {
      setActiveTab("game");
    } else {
      // Always default to "info" unless snatch is starting soon or active
      setActiveTab("info");
    }

    // Mark that initial tab has been set
    initialTabSetRef.current = true;

    console.log("Initial tab set based on game state:", {
      isSnatchStartingSoon,
      isSnatchActive,
      isGameOver,
      activeTab: isSnatchStartingSoon || isSnatchActive ? "game" : "info",
    });
  }, [eventData, setActiveTab]);

  // Handle tab switching based on game phase changes ONLY if the component is already mounted
  // and the initial tab has been set
  useEffect(() => {
    // Skip this effect during initial render
    if (isInitialRenderRef.current) return;

    // Only switch tabs automatically if the component is already mounted
    // and the initial tab has been set
    if (!hasMounted || !initialTabSetRef.current) return;

    // Only switch tabs if the game phase changes after the initial load
    if (gamePhase === "active") {
      setActiveTab("game");
    } else if (gamePhase === "gameover") {
      setActiveTab("results");
    }
  }, [gamePhase, setActiveTab, hasMounted]);

  // Check snatch start time when component mounts
  useEffect(() => {
    void checkSnatchStartTime();
  }, [checkSnatchStartTime]);

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
  console.log("xx gamePhase:", gamePhase);
  console.log("xx activeTab:", activeTab);
  console.log("xx hasMounted:", hasMounted);
  console.log("xx initialTabSet:", initialTabSetRef.current);
  console.log("xx isInitialRender:", isInitialRenderRef.current);

  // Determine which tabs to show based on game state
  const isGameOverState = gamePhase === "gameover";
  const availableTabs = isGameOverState
    ? ["info", "results"]
    : ["info", "game"];

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
        {availableTabs.map((tab) => (
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
        <GameInfoView palette={palette} session={session} />
      )}
      {/* Show Game View */}
      {activeTab === "game" && gamePhase !== "gameover" && (
        <GameView
          palette={palette}
          snatchStartTime={new Date(eventData.snatchStartTime)}
        />
      )}
      {/* Show Results View */}
      {activeTab === "results" && gamePhase === "gameover" && eventData && (
        <GameResultsView palette={palette} resultsPlayers={players} />
      )}
    </main>
  );
}
