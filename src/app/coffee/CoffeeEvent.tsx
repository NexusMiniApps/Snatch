"use client";

import { useEffect, useState } from "react";
import { useVibrantPalette } from "~/lib/usePalette";
import { InfoView } from "~/components/views/InfoView";
import { GameView } from "~/components/views/GameView";
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
  const palette = useVibrantPalette("/images/coffee.jpeg");
  const {
    socket,
    currentPlayerCount,
    currentPlayerId,
    players,
    setCurrentPlayerCount,
  } = useGameSocket(session);

  const eventId = "d6c0f003-e5cf-4835-88b0-debd2cc48d1b";

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          // print the response
          console.log(res);
          throw new Error("Failed to fetch event data");
        }
        const data: EventData = await res.json() as EventData;
        
        setEventData(data);
        console.log("Fetched event data:", data); // Updated to log the fetched data
      } catch (err: unknown) { // Changed from any to unknown
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchEvent(); // Added void to handle the promise
  }, [eventId]);


  if (loading) return <div>Loading...</div>;
  if (error || !eventData)
    return <div>Error loading event details: {error}</div>;

  const {
    name: eventName,
    location: eventLocation,
    startTime: eventStartTime,
    description: eventDescription,
    status: eventStatus,
    ownerId: eventOwnerId,
    snatchStartTime: eventSnatchStartTime,
  } = eventData;

  console.log(session);

  const handleTimeUp = () => {
    setActiveTab("game");
  };

  const handleGameComplete = () => {
    setIsGameOver(true);
  };

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
        <InfoView palette={palette} onTimeUp={handleTimeUp} eventData={eventData} />
      )}
      {activeTab === "game" && (
        <GameView
          socket={socket}
          currentPlayerCount={currentPlayerCount}
          currentPlayerId={currentPlayerId}
          players={players}
          onGameComplete={handleGameComplete}
          isGameOver={isGameOver}
          setCurrentPlayerCount={setCurrentPlayerCount}
          palette={palette}
          eventData={eventData}
        />
      )}
    </main>
  );
}
