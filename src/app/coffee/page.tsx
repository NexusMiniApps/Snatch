"use client";

import { FaLocationDot } from "react-icons/fa6";
import { IoTime } from "react-icons/io5";
import { IoMdNotifications } from "react-icons/io";
import { useVibrantPalette } from "~/lib/usePalette";
import Image from "next/image";
import CountdownDisplay from "~/components/ui/CountdownDisplay";

export default function Home() {
  const imageSlug = "/images/coffee.jpeg";
  const eventName = "Specialty Coffee Workshop";
  const eventLocation = "SUTD";
  const eventDate = "21st February, Friday";
  const eventTime = "10:00am";
  const eventDescription =
    "Learn how to make delicious filter coffee in this exclusive workshop (valued at $88)!";
  const countdownDate = "2025-02-21T00:00:00";

  const palette = useVibrantPalette("/images/coffee.jpeg");

  return (
    <main
      style={{ backgroundColor: palette.lightVibrant }}
      className="flex min-h-screen flex-col items-center gap-y-6 overflow-hidden px-4 pt-6"
    >
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
        <CountdownDisplay countdownDate={countdownDate} />
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
    </main>
  );
}
