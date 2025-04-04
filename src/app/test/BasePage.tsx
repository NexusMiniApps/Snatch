"use client";

import { useEffect, useState } from "react";
import { useVibrantPalette } from "~/lib/usePalette";
import { InfoView } from "~/components/views/InfoView";
import { GameView } from "~/components/views/GameView";
import useGameSocket from "~/lib/useGameSocket";
import { ResultsView } from "~/components/views/ResultsView";
import { CommentView } from "~/components/views/CommentView";
import { VoteComment } from "~/components/views/VoteComment";
import {
  registerParticipant,
  handleJoinGiveaway,
  type EventParticipantResponse,
  fetchEvent,
  type EventData,
  fetchUserTicket,
  checkPrerequisites,
} from "~/lib/registrationUtils";
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

type TabType = "info" | "game" | "results" | "comments" | "vote";

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

  const palette = useVibrantPalette("/misc/post.jpg");
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
        const data = await fetchEvent();
        setEventData(data);

        // If user is logged in, fetch their ticket and check prerequisites
        if (session?.user?.id) {
          // Fetch user's ticket
          // If no existing ticket is found, register the participant
          await fetchUserTicket(
            session.user.id,
            eventId,
            setTicketNumber,
            setHasJoined,
          );
          // Check prerequisites
          await checkPrerequisites(
            session.user.id,
            eventId,
            setSocialAFollowed,
            setSocialBFollowed,
          );
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
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
          setHasJoined,
        );
      }
    }
  }, [socialAFollowed, socialBFollowed]);

  const hasSnatchTimePassed = eventData
    ? new Date(eventData.snatchStartTime).getTime() +
        GAME_SETTINGS.SNATCH_TIME_BUFFER <
      Date.now()
    : false;

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
      {/* Tab Navigation */}
      <div className="z-20 flex w-full max-w-96 gap-2">
        {["info", "comments", "vote"].map((tab) => (
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
        <InfoView palette={palette} session={session} />
      )}
      {/* Show Game View */}
      {activeTab === "game" &&
        !isGameOver &&
        !hasSnatchTimePassed &&
        eventData && (
          <GameView
            palette={palette}
            snatchStartTime={new Date(eventData.snatchStartTime)}
          />
        )}
      {/* Show Results View */}
      {activeTab === "results" && eventData && (
        <ResultsView palette={palette} resultsPlayers={players} />
      )}
      {/* Show Comments View */}
      {activeTab === "comments" && <CommentView palette={palette} />}
      {/* Show Vote Comment View */}
      {activeTab === "vote" && <VoteComment />}
    </main>
  );
}
