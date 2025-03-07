"use client";

import { useEffect, useState } from "react";
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

export interface EventData {
  id: string;
  name: string;
  location: string;
  startTime: Date;
  description: string;
  status: string;
  ownerId: string;
  snatchStartTime: Date;
  // imageSlug: string;
  // add any other fields that your event contains
}
// TODO: Should generalize to all events next time
export default function CoffeeEvent({ session }: { session: AuthSession }) {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [isGameOver, setIsGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);

  const palette = useVibrantPalette("/images/coffee.jpeg");
  const {
    socket,
    currentPlayerCount,
    currentPlayerId,
    players,
    setCurrentPlayerCount,
  } = useGameSocket(session);

  const eventId = "d6c0f003-e5cf-4835-88b0-debd2cc48d1b"; // Make sure this is correct

  // Add loading state check
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          console.log("Response error:", res);
          throw new Error("Failed to fetch event data");
        }
        const data = (await res.json()) as EventData;
        console.log("Fetched event data:", data);
        setEventData(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchEvent();
  }, [eventId]);

  const hasSnatchTimePassed = eventData
    ? new Date(eventData.snatchStartTime).getTime() + 30000 < Date.now()
    : false;

  // Modified useEffect to set both isGameOver and activeTab
  useEffect(() => {
    if (hasSnatchTimePassed) {
      console.log("Snatch time plus one minute has passed, setting game over");
      setIsGameOver(true);
      setActiveTab("results"); // Automatically switch to results tab
    }
  }, [hasSnatchTimePassed]);

  // Debug logs
  console.log("Render state:", {
    loading,
    error,
    eventData,
    snatchStartTime: eventData?.snatchStartTime,
    activeTab,
    isGameOver,
    hasSnatchTimePassed,
    currentTime: new Date().toISOString(),
  });

  // Loading state
  if (loading) {
    return <div>Loading event details...</div>;
  }

  // Error state
  if (error || !eventData) {
    return <div>Error loading event details: {error}</div>;
  }

  console.log(session);
  const handleTimeUp = () => {
    console.log("Time up handler called");
    if (hasSnatchTimePassed) {
      setActiveTab("results");
      console.log("Setting active tab to results");
    } else {
      setActiveTab("game");
    }
  };

  const handleGameComplete = () => {
    console.log("Game complete handler called");
    setIsGameOver(true);
    setActiveTab("results");
  };

  // Get available tabs based on game state and snatch time
  const availableTabs: TabType[] =
    hasSnatchTimePassed || isGameOver ? ["info", "results"] : ["info", "game"];

  // console.log("Available tabs:", availableTabs);

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
      {/* Show Info View */}
      {activeTab === "info" && eventData && (
        <InfoView
          players={players}
          palette={palette}
          onTimeUp={handleTimeUp}
          eventData={eventData}
        />
      )}
      {/* Show Game View */}
      {activeTab === "game" &&
        !isGameOver &&
        !hasSnatchTimePassed &&
        eventData && (
          <GameView
            socket={socket}
            currentPlayerCount={currentPlayerCount}
            currentPlayerId={currentPlayerId}
            players={players}
            onGameComplete={handleGameComplete}
            isGameOver={isGameOver}
            setCurrentPlayerCount={setCurrentPlayerCount}
            palette={palette}
            snatchStartTime={new Date(eventData.snatchStartTime)}
            eventData={eventData}
          />
        )}
      {/* Show Results View */}
      {activeTab === "results" && eventData && (
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
