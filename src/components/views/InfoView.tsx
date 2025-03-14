"use client";

import { FaLocationDot } from "react-icons/fa6";
import { IoTime } from "react-icons/io5";
import Image from "next/image";
import CountdownDisplay from "~/components/ui/CountdownDisplay";
import { type EventData } from "~/app/coffee/CoffeeEvent";
import { PlayerData } from "~/lib/useGameSocket";

interface InfoViewProps {
  palette: {
    lightMuted: string;
    darkMuted: string;
  };
  onTimeUp: () => void;
  eventData: EventData;
  players: PlayerData[];
}

export function InfoView({
  palette,
  onTimeUp,
  eventData,
  players,
}: InfoViewProps) {
  // Use the useGameSocket hook to get players

  // Event info data
  const imageSlug = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/images/image.webp`
    : "/images/image.webp";
  // const eventName = "Specialty Coffee Workshop";
  // const eventLocation = "SUTD";
  // const eventDate = "21st February, Friday";
  // const eventTime = "10:00am";
  // const eventDescription =
  //   "Learn how to make delicious filter coffee in this exclusive workshop (valued at $88)!";
  // const countdownDate = "2025-02-21T00:00:00";

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

  return (
    <div className="flex w-full flex-col items-center gap-y-4">
      <section className="z-10 h-60 w-full max-w-96 rounded-xl border-2 border-solid border-black bg-white p-1 shadow-xl">
        <div className="relative h-full w-full rounded-xl">
          <Image
            className="rounded-lg object-cover"
            src={imageSlug}
            alt="Brewed Coffee"
            fill
          />
        </div>
      </section>

      <section className="relative flex w-full max-w-96 flex-col px-2 py-4">
        <div
          style={{
            backgroundColor: palette.lightMuted,
          }}
          className="pointer-events-none absolute bottom-[-3.5rem] left-[-1.5rem] right-[-1.5rem] top-[-4rem] rounded-xl border-2 border-black"
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

      <section className="z-10 flex w-full max-w-96 flex-col items-center">
        <button className="custom-box w-full p-1 shadow-lg">
          <div className="flex h-16 w-full items-center justify-center rounded-xl bg-gray-800 px-4 py-3 text-3xl font-medium text-white">
            Join the Giveaway!
          </div>
        </button>

        <div className="font-lights px-2 py-4 text-lg">
          <span className="font-semibold">{players.length}</span> people have
          joined...
        </div>
      </section>
    </div>
  );
}
