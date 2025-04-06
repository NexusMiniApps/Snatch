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

export function ChosenInfoView({ palette }: InfoViewProps) {
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

  const [commentCount, setCommentCount] = useState<number>(0);

  useEffect(() => {
    async function fetchCommentCount() {
      try {
        const response = await fetch("/misc/matchaGiveaway.json");
        if (!response.ok) {
          throw new Error("Failed to load comments");
        }
        const data = (await response.json()) as Comment[];
        setCommentCount(data.length);
      } catch (error) {
        console.error("Error fetching comment count:", error);
      }
    }

    void fetchCommentCount();
  }, [eventData?.id]);

  return (
    <div className="flex w-full flex-col items-center gap-y-4 px-4">
      <section className="z-10 h-80 w-full max-w-sm rounded-xl border-2 border-solid border-black bg-white p-1 shadow-xl">
        <div className="relative h-full w-full rounded-xl">
          <Image
            className="rounded-lg object-cover"
            src="/misc/post.jpg"
            alt="Matcha Giveaway Poster" 
            fill
          />
        </div>
      </section>
      
      <section className="relative flex w-full max-w-sm flex-col px-2 py-4">
        <div
          style={{
            backgroundColor: palette.lightMuted,
          }}
          className="pointer-events-none absolute bottom-[-1.5rem] left-[-1.5rem] right-[-1.5rem] top-[-3.5rem] rounded-xl border-2 border-black"
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
      
      {/* Comment count moved outside the section */}
      <div className="z-10 mt-8 w-full max-w-sm text-center font-light text-lg">
        <span className="font-semibold">{commentCount}</span> comments were made on the giveaway post!
      </div>
    </div>
  );
}
