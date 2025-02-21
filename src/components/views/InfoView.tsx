"use client";

import { useEffect, useState } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { IoTime } from "react-icons/io5";
import { IoMdNotifications } from "react-icons/io";
import Image from "next/image";
import CountdownDisplay from "~/components/ui/CountdownDisplay";
import { EventData } from "~/app/coffee/CoffeeEvent";

interface InfoViewProps {
  palette: {
    lightMuted: string;
  };
  onTimeUp: (countdownDate: string) => void;
  eventData: EventData;
}

export function InfoView({ palette, onTimeUp, eventData }: InfoViewProps) {
  // Event info data
  const imageSlug = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/images/coffee.jpeg`
    : "/images/coffee.jpeg";
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

  const countdownDate = new Date(eventSnatchStartTime).toISOString();

  const eventDate = new Date(eventStartTime).toLocaleDateString();
  const eventTime = new Date(eventStartTime).toLocaleTimeString();

  return (
    <div className="flex flex-col items-center gap-y-4">
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
          className="pointer-events-none absolute bottom-[-3.5rem] left-[-1.5rem] right-[-1.5rem] top-[-4rem] border-y-2 border-black"
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
        <CountdownDisplay
          countdownDate={countdownDate}
          onTimeUp={() => onTimeUp(countdownDate)}
          onDisplayClick={() => onTimeUp(countdownDate)}
        />
        <div className="px-2 py-4 text-lg font-light">
          <span className="font-semibold">18</span> people currently waiting
          here...
        </div>
      </section>
    </div>
  );
}
