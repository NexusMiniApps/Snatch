"use client";

import { useEffect, useState } from "react";
import { useVibrantPalette } from "~/lib/usePalette";
import { InfoView } from "~/components/views/InfoView";
import { GameView } from "~/components/views/GameView";
import useGameSocket from "~/lib/useGameSocket";
import { ResultsView } from "~/components/views/ResultsView";
import { registerParticipant, handleJoinGiveaway, type EventParticipantResponse, fetchEvent, type EventData, fetchUserTicket, checkPrerequisites } from "~/lib/registrationUtils";
import { EVENT_IDS, GAME_SETTINGS } from "~/lib/settings";

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

// TODO: Should generalize to all events next time
export default function BasePage({ session }: { session: AuthSession }) {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [isGameOver, setIsGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  // Social media overlay states - moved from GameView
  const [socialAFollowed, setSocialAFollowed] = useState(false);
  const [socialBFollowed, setSocialBFollowed] = useState(false);
  // Ticket-related states from InfoView
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const palette = useVibrantPalette("/images/pokemon.jpg");
  const {
    socket,
    currentPlayerCount,
    currentPlayerId,
    players,
    setCurrentPlayerCount,
    messages,
    sendMessage,
  } = useGameSocket(session);

  const eventId = EVENT_IDS.HUATZARD_EVENT;

  // Combined initialization effect
  useEffect(() => {
    void (async () => {
      try {
        // On component mount, load event data into state
        const data = await fetchEvent(eventId);
        setEventData(data);

        // If user is logged in, fetch their ticket and check prerequisites
        if (session?.user?.id) {
          // Fetch user's ticket
          // If no existing ticket is found, register the participant
          await fetchUserTicket(session.user.id, eventId, setTicketNumber, setHasJoined)
          // Check prerequisites
          await checkPrerequisites(session.user.id, eventId, setSocialAFollowed, setSocialBFollowed);
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user?.id, eventId]);

  // Update the useEffect that calls handleJoinGiveaway
  useEffect(() => {
    // Check if both social accounts are followed
    if (socialAFollowed && socialBFollowed) {
      // Only call handleJoinGiveaway if user isn't already registered
      if (!hasJoined && session?.user?.id && eventData?.id) {
        console.log("Both socials followed - automatically joining giveaway");
        void handleJoinGiveaway(
          session.user.id,
          eventData.id,
          setIsLoading,
          setTicketNumber,
          setHasJoined
        );
      }
    }
  }, [socialAFollowed, socialBFollowed]);

  const hasSnatchTimePassed = eventData
    ? new Date(eventData.snatchStartTime).getTime() + GAME_SETTINGS.SNATCH_TIME_BUFFER < Date.now()
    : false;

  // Commented out for now because we are not running the game yet
  // Also game logic should be handled direct in the game component, yet to implement

  // // Modified useEffect to set both isGameOver and activeTab
  // useEffect(() => {
  //   if (hasSnatchTimePassed) {
  //     console.log("Snatch time plus one minute has passed, setting game over");
  //     setIsGameOver(true);
  //     setActiveTab("info"); // Automatically switch to results tab
  //   }
  // }, [hasSnatchTimePassed]);

    // // Get available tabs based on game state and snatch time
    // const availableTabs: TabType[] =
    // hasSnatchTimePassed || isGameOver ? ["info", "results"] : ["info", "game"];

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

  const handleTimeUp = () => {
    if (hasSnatchTimePassed) {
      setActiveTab("info");
    } else {
      setActiveTab("info");
    }
  };

  const handleGameComplete = () => {
    setIsGameOver(true);
    setActiveTab("info");
  };

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
      {/* Social Media Overlay */}
      {(!socialAFollowed || !socialBFollowed) && (
        <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md">
          <div className="m-3 mt-2 flex w-full max-w-md flex-col items-center rounded-xl bg-white bg-opacity-90 p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
              Huatzard Hobbyfest Card Show Giveaway is over!
            </h2>
            <p className="mb-6 text-center text-gray-600">
              Follow our social media accounts to keep up with future events and giveaways!
            </p>
            <div className="flex w-full flex-col gap-4">
              {!socialAFollowed && (
                <div className="custom-box flex w-full p-1">
                  <a
                    href="https://t.me/huatzard"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setSocialAFollowed(true);
                    }}
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
                    onClick={() => {
                      setSocialBFollowed(true);
                    }}  
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
          ticketNumber={ticketNumber}
          hasJoined={hasJoined}
          isLoading={isLoading}
          handleJoinGiveaway={async () => {
            if (session?.user?.id && eventData?.id) {
              await handleJoinGiveaway(
                session.user.id,
                eventData.id,
                setIsLoading,
                setTicketNumber,
                setHasJoined
              );
            }
          }}
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
