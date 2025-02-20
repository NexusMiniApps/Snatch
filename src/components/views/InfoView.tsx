"use client";

import { useEffect, useState } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { IoTime } from "react-icons/io5";
import { IoMdNotifications } from "react-icons/io";
import Image from "next/image";
import CountdownDisplay from "~/components/ui/CountdownDisplay";

interface InfoViewProps {
  palette: {
    lightMuted: string;
  };
  onTimeUp: () => void;
}

interface EventData {
  id: number;
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


export function InfoView({ palette, onTimeUp }: InfoViewProps) {
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

  
  const id = "d6c0f003-e5cf-4835-88b0-debd2cc48d1b";

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`);
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
  }, [id]);


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
        <CountdownDisplay countdownDate={countdownDate} onTimeUp={onTimeUp} />
        <div className="px-2 py-4 text-lg font-light">
          <span className="font-semibold">18</span> people currently waiting
          here...
        </div>
        <div className="relative flex w-full items-center justify-between gap-x-2 px-2 sm:justify-center">
          <div className="z-10 flex w-full flex-col font-light">
            <div>Don&apos;t lose out on the Snatch!</div>
            <div className="text-xs font-light">
              54 people have turned on notifications.
            </div>
          </div>
          <div className="z-10 flex w-20 items-center justify-center rounded-md rounded-xl border-2 border-black bg-white p-4 shadow-xl">
            <IoMdNotifications className="fill-current text-3xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
