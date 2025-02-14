
"use client"

import { FaLocationDot } from "react-icons/fa6";
import { IoTime } from "react-icons/io5";
import { IoMdNotifications } from "react-icons/io";
import { useVibrantPalette } from "~/lib/usePalette";
import Image from "next/image";
import CountdownDisplay from "~/components/ui/CountdownDisplay";

export default function Home() {

  const imageSlug = "/images/coffee.jpeg";
  const eventName = "Specialty Coffee Workshop"
  const eventLocation = "SUTD"
  const eventDate = "21st February, Friday"
  const eventTime = "10:00am"
  const eventDescription = "Learn how to make delicious filter coffee in this exclusive workshop (valued at $88)!"
  const countdownDate = "2025-02-21T00:00:00"


  const palette = useVibrantPalette("/images/coffee.jpeg");


  return (
    <main style={{ backgroundColor: palette.lightVibrant }} className="flex min-h-screen flex-col items-center pt-6 px-4 gap-y-6 overflow-hidden">


      <section className="border-solid border-2 border-black rounded-xl p-1 bg-white w-full h-60 max-w-96 z-10 shadow-xl">
        <div className="relative rounded-xl w-full h-full">
          <Image
            className="object-cover rounded-lg"
            src={imageSlug}
            alt="Brewed Coffee"
            fill
          />
        </div>
      </section>


      <section className="relative flex flex-col w-full px-2 max-w-96 py-4">
        <div
          style={{
            backgroundColor: palette.lightMuted

          }}
          className="absolute top-[-4rem] bottom-[-3.5rem] left-[-1.5rem] right-[-1.5rem] pointer-events-none border-y-2 border-black"
        />
        <div className="z-10 flex flex-col w-full gap-y-4 px-2  max-w-96">
          <div className=" w-full text-xl font-medium">
            {eventName}
          </div>

          <div className="flex w-full items-center text-md">
            <FaLocationDot className="mr-2" /> {eventLocation}
          </div>

          <div className="flex w-full items-center text-md">
            <IoTime className="mr-2" />{eventDate} <span className="mx-2">·</span> {eventTime}
          </div>

          <div className="flex w-full items-center font-light text-md">
            {eventDescription}
          </div>
        </div>
      </section>


      <section className="w-full flex flex-col items-center max-w-96 z-10">
        <CountdownDisplay countdownDate={countdownDate} />
        <div className="px-2 py-4 text-lg font-light ">
          <span className="font-semibold">18</span> people currently waiting here...
        </div>
        <div className="relative flex w-full items-center justify-between sm:justify-center px-4 gap-x-2">
          <div className="flex flex-col w-full z-10 font-light">
            <div >
              Don&apos;t lose out on the Snatch!
            </div>
            <div className="text-xs font-light">
              54 people have turned on notifications.
            </div>
          </div>
          <div className="flex rounded-md items-center justify-center border-2 border-black bg-white rounded-xl w-32 z-10 p-4 shadow-xl ">
            <IoMdNotifications className="text-3xl fill-current" />
          </div>
        </div>
      </section>


    </main>
  );
}

