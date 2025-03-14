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

  const eventId = "eb5946d8-4b98-479e-83a9-c4c8093c83a1"; // Make sure this is correct

  // Define interface for event participant response
  interface EventParticipantResponse {
    ticketNumber: string | null;
    hasJoinedGiveaway: boolean;
    isPreReg: boolean;
    hasPreReg: boolean;
    userId: string;
    eventId: string;
  }

  // Define interface for ticket response
  interface TicketResponse {
    ticketNumber: string;
  }

  // Handle social media link clicks - moved from GameView
  const handleSocialAClick = () => {
    setSocialAFollowed(true);
  };

  const handleSocialBClick = () => {
    setSocialBFollowed(true);
  };

  async function registerParticipant() {
    console.log("xx registerParticipant");
    if (session?.user?.id) {
      try {
        // First, generate a ticket number
        const ticketResponse = await fetch("/api/generateTicket", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: eventId,
            userId: session.user.id,
          }),
        });

        if (!ticketResponse.ok) {
          throw new Error("Failed to generate ticket number");
        }

        const ticketData = (await ticketResponse.json()) as TicketResponse;
        const newTicketNumber = ticketData.ticketNumber;

        // Then register the participant with the ticket number
        const response = await fetch("/api/eventParticipant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: eventId,
            userId: session.user.id,
            isPreReg: true,
            hasJoinedGiveaway: true,
            ticketNumber: newTicketNumber,
          }),
        });

        if (!response.ok) {
          console.error(
            "Failed to register participant:",
            await response.text(),
          );
        } else {
          // Update local state with the new ticket number
          setTicketNumber(newTicketNumber);
          setHasJoined(true);
          console.log(
            "Successfully registered as participant with ticket:",
            newTicketNumber,
          );
        }
      } catch (error) {
        console.error("Error registering participant:", error);
      }
    }
  }

  // Generate a random 6-digit number - moved from InfoView
  const generateTicketNumber = async (): Promise<string> => {
    if (!session?.user?.id || !eventData?.id) {
      throw new Error("User or event data missing");
    }

    setIsLoading(true);

    try {
      // Try to generate a unique ticket number
      const response = await fetch("/api/generateTicket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: eventData.id,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate ticket");
      }
      const data = (await response.json()) as TicketResponse;
      return data.ticketNumber;
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGiveaway = async () => {
    if (!session?.user?.id) {
      // Handle not logged in
      return;
    }

    try {
      if (!ticketNumber) {
        // Generate new ticket number
        const newTicket = await generateTicketNumber();
        setTicketNumber(newTicket);

        // Update DB with the ticket number
        const response = await fetch("/api/eventParticipant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: eventData?.id,
            userId: session.user.id,
            isPreReg: true,
            hasJoinedGiveaway: true,
            ticketNumber: newTicket,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as EventParticipantResponse;
          console.log("Successfully joined giveaway", data);
          setHasJoined(true);
        } else {
          console.error("Failed to join giveaway:", await response.text());
        }

        // setShowTicketDialog(true); - Removed as requested
      } else {
        // Already has a ticket, just show it
        // setShowTicketDialog(true); - Removed as requested
      }
    } catch (error) {
      console.error("Error joining giveaway:", error);
    }
  };

  // Fetch user's existing ticket on component mount
  useEffect(() => {
    async function fetchUserTicket() {
      console.log("Fetching user ticket1");
      if (!session?.user?.id || !eventId) return;
      console.log("Fetching user ticket2");
      console.log("xx session.user.id", session.user.id);
      console.log("xx eventId", eventId);
      try {
        const response = await fetch(
          `/api/eventParticipant?userId=${session.user.id}&eventId=${eventId}`,
        );
        console.log("xx response", response);
        if (response.ok) {
          const data = (await response.json()) as EventParticipantResponse;
          console.log("xx data", data);
          if (data.ticketNumber) {
            setTicketNumber(data.ticketNumber);
            setHasJoined(data.hasJoinedGiveaway ?? false);
            console.log("xx Ticket number:", data.ticketNumber);
            console.log("xx Has joined:", data.hasJoinedGiveaway);
          }
        } else {
          console.log("xx Failed to fetch ticket:", response.status);
          if (response.status === 404) {
            // If participant not found, we'll register them
            console.log("xx Participant not found, registering...");
            await registerParticipant();
          } else {
            // For other errors, throw an error to be caught by the catch block
            throw new Error(`Failed to fetch ticket: ${response.status}`);
          }
        }
      } catch (error) {
        console.log("xx error", error);
        console.error("Error fetching ticket:", error);
      }
    }

    if (session?.user) {
      console.log("xx Fetching user ticket3");
      fetchUserTicket().catch(() => {
        console.log("xx dont have ticket");
        void registerParticipant();
      });
    }
  }, [session?.user?.id, eventId]);

  // Check if user has already completed prerequisites
  useEffect(() => {
    async function checkPrerequisites() {
      if (!session?.user?.id || !eventId) return;

      try {
        const response = await fetch(
          `/api/eventParticipant?eventId=${eventId}&userId=${session.user.id}`,
        );

        if (response.ok) {
          const participantData =
            (await response.json()) as EventParticipantResponse;

          // If the participant has completed prerequisites, set both social follows to true
          if (participantData.hasPreReg === true) {
            setSocialAFollowed(true);
            setSocialBFollowed(true);
            console.log(
              "Prerequisites already completed, social requirements satisfied",
            );
          }
        } else {
          console.log("No existing participation record found or other error");
          await registerParticipant();
        }
      } catch (error) {
        console.error("Error checking prerequisites status:", error);
      }
    }

    void checkPrerequisites();
  }, [session?.user?.id, eventId]);

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
        return data;
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
          <div className="m-3 mt-2 flex w-full max-w-md flex-col items-center rounded-xl bg-white bg-opacity-90 p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
              Follow Our Socials!
            </h2>
            <p className="mb-6 text-center text-gray-600">
              Follow our social media accounts to qualify for the giveaway!
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
          ticketNumber={ticketNumber}
          hasJoined={hasJoined}
          isLoading={isLoading}
          handleJoinGiveaway={handleJoinGiveaway}
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
