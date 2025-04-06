"use client";

import Image from "next/image";
import { usePartySocket } from "~/PartySocketContext";
import { useEffect, useState } from "react";
import { type AuthSession } from "~/app/game/BasePage";
import { FaLocationDot } from "react-icons/fa6";
import { IoTime } from "react-icons/io5";

interface InfoViewProps {
  palette: {
    lightMuted: string;
  };
  session: AuthSession;
}

export function RandomInfoView({ palette }: InfoViewProps) {
  const { ticketNumber, hasJoined, eventData } = usePartySocket();

  const eventStartTime = eventData?.startTime ?? "";
  const eventName = eventData?.name ?? "";
  const eventLocation = eventData?.location ?? "";
  const eventDescription = eventData?.description ?? "";

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

  const [giveawayParticipantCount, setGiveawayParticipantCount] =
    useState<number>(0);
  const [commentCount, setCommentCount] = useState<number>(0);

  console.log("hasJoined", hasJoined);
  console.log("ticketNumber", ticketNumber);

  useEffect(() => {
    async function fetchParticipantCount() {
      if (!eventData?.id) return;

      try {
        const response = await fetch(
          `/api/eventParticipant/count?eventId=${eventData.id}&hasJoined=true`,
        );

        if (response.ok) {
          const data = (await response.json()) as { count: number };
          setGiveawayParticipantCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching participant count:", error);
      }
    }

    void fetchParticipantCount();
  }, [eventData?.id]);

  return (
    <div className="flex w-full flex-col items-center gap-y-4 px-4">
      <section className="z-10 h-80 w-full max-w-sm rounded-xl border-2 border-solid border-black bg-white p-1 shadow-xl">
        <div className="relative h-full w-full rounded-xl">
          <Image
            className="rounded-lg object-cover"
            src="/images/pokemon.jpg"
            alt="Pokemon Booster Box"
            fill
          />
        </div>
      </section>
      <section className="z-10 h-20 w-20 max-w-sm rounded-full border-2 border-solid border-black bg-white p-1 shadow-xl">
        <div className="relative h-full w-full rounded-xl">
          <Image
            className="rounded-full object-cover"
            src="/images/profile.png"
            alt="Host Logo"
            fill
          />
        </div>
      </section>
      <section className="relative flex w-full max-w-sm flex-col px-2 py-4">
        <div
          style={{
            backgroundColor: palette.lightMuted,
          }}
          className="pointer-events-none absolute bottom-[-3.5rem] left-[-1.5rem] right-[-1.5rem] top-[-3.5rem] rounded-xl border-2 border-black"
        />
        <div className="z-10 flex w-full flex-col gap-y-4 px-2">
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
      <section className="z-10 flex w-full max-w-sm flex-col items-center rounded-xl shadow-lg">
        <button
          // onClick={handleJoinGiveaway}
          className="custom-box z-10 w-full p-1"
        >
          <div className="flex w-full items-center justify-between rounded-xl bg-gray-100">
            <div className="text-md flex flex-1 justify-center font-medium">
              Your Ticket Number:
            </div>
            <div className="flex w-44 justify-center rounded-lg bg-gray-800 px-4 py-3 text-4xl font-medium text-white">
              {ticketNumber}
            </div>
          </div>
        </button>
      </section>
      <section className="z-10 flex w-full max-w-sm flex-col items-center pt-2">
        <div className="font-light px-2 text-lg text-center">
          <span className="font-semibold">{giveawayParticipantCount}</span> people have
          joined the giveaway!
        </div>
      </section>
    </div>
  );
}
