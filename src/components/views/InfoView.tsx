"use client";

import { FaLocationDot } from "react-icons/fa6";
import { IoTime } from "react-icons/io5";
import Image from "next/image";
import CountdownDisplay from "~/components/ui/CountdownDisplay";
import { type AuthSession, type EventData } from "~/app/giveaway/CoffeeEvent";
import { PlayerData } from "~/lib/useGameSocket";
import { useEffect, useState } from "react";

interface TicketResponse {
  ticketNumber: string;
}

interface EventParticipantResponse {
  ticketNumber: string;
  hasJoinedGiveaway: boolean;
}

interface InfoViewProps {
  palette: {
    lightMuted: string;
  };
  onTimeUp: () => void;
  eventData: EventData;
  players: PlayerData[];
  session: AuthSession;
}

export function InfoView({
  palette,
  onTimeUp,
  eventData,
  players,
  session,
}: InfoViewProps) {
  // Use the useGameSocket hook to get players

  // Event info data
  const imageSlug = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/images/pokemon.jpg`
    : "/images/pokemon.jpg";

  const eventSnatchStartTime = eventData.snatchStartTime;
  const eventStartTime = eventData.startTime;
  const eventName = eventData.name;
  const eventLocation = eventData.location;
  const eventDescription = eventData.description;

  const eventDate = new Date(eventStartTime).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const eventTime = new Date(eventStartTime)
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Enable 12-hour format with AM/PM
    })
    .toLowerCase(); // Make am/pm lowercase

  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Generate a random 6-digit number
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
        await fetch("/api/eventParticipant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: eventData.id,
            userId: session.user.id,
            isPreReg: true,
            hasJoinedGiveaway: true,
            ticketNumber: newTicket,
          }),
        });

        setHasJoined(true);
        setShowTicketDialog(true);
      } else {
        // Already has a ticket, just show it
        setShowTicketDialog(true);
      }
    } catch (error) {
      console.error("Error joining giveaway:", error);
    }
  };

  // Fetch user's existing ticket on component mount
  useEffect(() => {
    async function fetchUserTicket() {
      if (!session?.user?.id || !eventData?.id) return;

      try {
        const response = await fetch(
          `/api/eventParticipant?userId=${session.user.id}&eventId=${eventData.id}`,
        );

        if (response.ok) {
          const data = (await response.json()) as EventParticipantResponse;

          // Only set the ticket number if it exists
          if (data.ticketNumber) {
            setTicketNumber(data.ticketNumber);
            setHasJoined(data.hasJoinedGiveaway);
            console.log("Ticket number:", data.ticketNumber);
            console.log("Has joined:", data.hasJoinedGiveaway);
          }
        }
      } catch (error) {
        console.error("Error fetching ticket:", error);
      }
    }

    void fetchUserTicket();
  }, [session?.user?.id, eventData?.id]);

  return (
    <div className="flex w-full flex-col items-center gap-y-4">
      <section className="z-10 h-64 w-full max-w-96 rounded-xl border-2 border-solid border-black bg-white p-1 shadow-xl">
        <div className="relative h-full w-full rounded-xl">
          <Image
            className="rounded-lg object-cover"
            src={imageSlug}
            alt="Pokemon Booster Box"
            fill
          />
        </div>
      </section>
      <section className="z-10 h-20 w-20 max-w-96 rounded-full border-2 border-solid border-black bg-white p-1 shadow-xl">
        <div className="relative h-full w-full rounded-xl">
          <Image
            className="rounded-lg object-cover"
            src="/images/profile.png"
            alt="Pokemon Booster Box"
            fill
          />
        </div>
      </section>

      <section className="relative flex w-full max-w-96 flex-col px-2 py-4">
        <div
          style={{
            backgroundColor: palette.lightMuted,
          }}
          className="pointer-events-none absolute bottom-[-3.5rem] left-[-1.5rem] right-[-1.5rem] top-[-3.5rem] rounded-xl border-2 border-black"
        />
        <div className="z-10 flex w-full max-w-96 flex-col gap-y-4 px-2">
          <div className="w-full text-xl font-medium">{eventName}</div>
          <div className="text-md flex w-full items-center">
            <FaLocationDot className="mr-2" /> {eventLocation}
          </div>
          <div className="text-md flex w-full items-center">
            <IoTime className="mr-2" />
            {eventDate} <span className="mx-2">·</span> {eventTime}
          </div>
          <div className="text-md flex w-full items-center font-light">
            {eventDescription}
          </div>
        </div>
      </section>
      <section className="flex w-full max-w-96 flex-col items-center rounded-xl shadow-lg">
        <button
          onClick={handleJoinGiveaway}
          className="custom-box z-10 w-full p-1"
        >
          {hasJoined ? (
            <div className="flex h-16 w-full items-center justify-center rounded-xl bg-gray-800 px-4 py-3 text-3xl font-medium text-white">
              Join the Giveaway!
            </div>
          ) : (
            <div className="flex w-full items-center justify-between rounded-xl bg-gray-100">
              <div className="text-md flex flex-1 justify-center font-medium">
                Your Ticket Number:
              </div>
              <div className="flex w-44 justify-center rounded-lg bg-gray-800 px-4 py-3 text-4xl font-medium text-white">
                {ticketNumber}
              </div>
            </div>
          )}
        </button>
      </section>

      <section className="z-10 flex w-full max-w-96 flex-col items-center">
        {/* <button
          className="custom-box w-full p-1 shadow-lg"
          onClick={handleJoinGiveaway}
          disabled={isLoading}
        >
          <div className="flex h-16 w-full items-center justify-center rounded-xl bg-gray-800 px-4 py-3 text-3xl font-medium text-white">
            {isLoading
              ? "Processing..."
              : hasJoined
                ? "Show My Ticket"
                : "Join the Giveaway!"}
          </div>
        </button>

        {ticketNumber && (
          <div className="mt-3 text-center">
            <div className="text-xl font-medium">Your Ticket Number</div>
            <div className="text-4xl font-bold tracking-wider">
              {ticketNumber}
            </div>
          </div>
        )} */}

        <div className="font-lights px-2 py-4 text-lg">
          <span className="font-semibold">{players.length}</span> people have
          joined the giveaway!
        </div>
      </section>

      {/* Ticket Popup Dialog */}
      {showTicketDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            id="ticket-popup"
            className="mx-4 max-w-md rounded-xl border-2 border-black bg-white p-8 shadow-lg"
          >
            <h2 className="mb-4 text-center text-xl font-bold">
              Your Giveaway Ticket!
            </h2>

            {ticketNumber && (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="text-md mb-2">Your unique ticket number is</div>
                <div className="text-4xl font-bold tracking-wider">
                  {ticketNumber}
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  Keep this number for the lucky draw. Screenshot to be safe!
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                className="rounded-md bg-gray-800 px-4 py-2 text-white"
                onClick={() => setShowTicketDialog(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
