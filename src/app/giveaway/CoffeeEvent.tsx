"use client";

import { useEffect, useState } from "react";
import { useVibrantPalette } from "~/lib/usePalette";
import { InfoView } from "~/components/views/InfoView";
import { GameView } from "~/components/views/GameView";
import useGameSocket from "~/lib/useGameSocket";
import { ResultsView } from "~/components/views/ResultsView";

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
  // Social media overlay states - moved from GameView
  const [socialAFollowed, setSocialAFollowed] = useState(false);
  const [socialBFollowed, setSocialBFollowed] = useState(false);

  const palette = useVibrantPalette("/images/image.webp");
  const {
    socket,
    currentPlayerCount,
    currentPlayerId,
    players,
    setCurrentPlayerCount,
    messages,
    sendMessage,
  } = useGameSocket(session);

  const eventId = "3dffa111-4981-43ac-bb0a-a82de560ea47"; // Make sure this is correct

  // Handle social media link clicks - moved from GameView
  const handleSocialAClick = () => {
    setSocialAFollowed(true);
  };

  const handleSocialBClick = () => {
    setSocialBFollowed(true);
  };

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

  useEffect(() => {
    async function registerParticipant() {
      if (session?.user?.id && eventData?.id) {
        try {
          const response = await fetch("/api/eventParticipant", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventId: eventData.id,
              userId: session.user.id,
              isPreReg: false,
              hasJoinedGiveaway: false,
            }),
          });

          if (!response.ok) {
            console.error(
              "Failed to register participant:",
              await response.text(),
            );
          } else {
            console.log("Successfully registered as participant");
          }
        } catch (error) {
          console.error("Error registering participant:", error);
        }
      }
    }

    if (eventData && session?.user) {
      void registerParticipant();
    }
  }, [eventData, session?.user]);

  const hasSnatchTimePassed = eventData
    ? new Date(eventData.snatchStartTime).getTime() + 30000 < Date.now()
    : false;

  // Modified useEffect to set both isGameOver and activeTab
  useEffect(() => {
    if (hasSnatchTimePassed) {
      console.log("Snatch time plus one minute has passed, setting game over");
      setIsGameOver(true);
      setActiveTab("info"); // Automatically switch to results tab
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
      setActiveTab("info");
      console.log("Setting active tab to results");
    } else {
      setActiveTab("info");
    }
  };

  const handleGameComplete = () => {
    console.log("Game complete handler called");
    setIsGameOver(true);
    setActiveTab("info");
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
      {/* Social Media Overlay - moved from GameView */}
      {(!socialAFollowed || !socialBFollowed) && (
        <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md">
          <div className="flex w-full max-w-md flex-col items-center rounded-xl bg-white bg-opacity-90 p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
              Follow Our Socials!
            </h2>
            <p className="mb-6 text-center text-gray-600">
              Follow our social media accounts to stay updated with the latest
              games and events!
            </p>
            <div className="flex w-full flex-col gap-4">
              {!socialAFollowed && (
                <div className="custom-box flex w-full p-1">
                  <a
                    href="https://t.me/huatzard"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleSocialAClick}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Telegram
                  </a>
                </div>
              )}
              {!socialBFollowed && (
                <div className="custom-box flex w-full p-1">
                  <a
                    href="https://www.tiktok.com/@huatzard"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleSocialBClick}
                    className="flex-1 rounded-lg bg-purple-600 px-4 py-3 text-center font-medium text-white transition-all hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    TikTok
                  </a>
                </div>
              )}
            </div>
            {(socialAFollowed || socialBFollowed) && (
              <p className="mt-4 text-center text-sm text-green-600">
                {socialAFollowed && socialBFollowed
                  ? "Thank you for following both accounts!"
                  : socialAFollowed
                    ? "Thanks for joining us on Telegram!"
                    : "Thanks for following us on TikTok!"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation
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
      </div> */}
      {/* Views */}
      {/* Show Info View */}
      {activeTab === "info" && eventData && (
        <InfoView
          players={players}
          palette={palette}
          onTimeUp={handleTimeUp}
          eventData={eventData}
          session={session}
        />
      )}
      {/* Show Game View */}
      {activeTab === "game" &&
        !isGameOver &&
        !hasSnatchTimePassed &&
        eventData && (
          <GameView
            sendMessage={sendMessage}
            messages={messages}
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
            // Pass the social media states as props to GameView
            socialAFollowed={socialAFollowed}
            socialBFollowed={socialBFollowed}
          />
        )}
      {/* Show Results View */}
      {activeTab === "results" && eventData && (
        <ResultsView
          sendMessage={sendMessage}
          messages={messages}
          palette={palette}
          resultsPlayers={players}
          socket={socket}
          currentPlayerId={currentPlayerId}
        />
      )}
    </main>
  );
}
