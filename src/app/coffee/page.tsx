
export const runtime = "nodejs";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { FaLocationDot } from "react-icons/fa6";
import { IoTime } from "react-icons/io5";
import { Vibrant } from "node-vibrant/node";
import Image from "next/image";
import CountdownTimer from "~/components/ui/countdown";



export default async function Home() {

  const imageSlug = "/images/coffee.jpeg";
  const eventName = "Specialty Coffee Workshop"
  const eventLocation = "SUTD"
  const eventDate = "21st February, Friday"
  const eventTime = "10:00am"
  const eventDescription = "Learn how to make delicious filter coffee in this exclusive workshop (valued at $88)!"
  const countdownDate = "2025-02-21T00:00:00"


  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();
  const palette = await Vibrant.from(`public${imageSlug}`).getPalette();
  const mutedColor = palette.LightMuted?.hex ?? "#ffffff";
  const vibrantColor = palette.LightVibrant?.hex ?? "#ffffff";


  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main style={{ backgroundColor: mutedColor }} className="flex min-h-screen flex-col items-center pt-4 px-4 gap-y-6">
        <div className="border-solid border-2 border-black rounded-xl p-1 bg-white w-full h-60">
          <div className="relative rounded-xl w-full h-full">
            <Image
              className="object-cover rounded-xl"
              src={imageSlug}
              alt="Brewed Coffee"
              fill
            />
          </div>
        </div>

        <div className="flex flex-col w-full gap-y-3 px-2">
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

        <div className="w-full custom-box p-1">
          <div className="flex w-full rounded-xl bg-gray-100 items-center justify-between">
            <div className="flex flex-1 text-lg font-medium justify-center">
              Free coffee in
            </div>
            <div className="flex px-4 py-2 text-4xl justify-center font-medium bg-gray-800 text-white rounded-xl w-48">
              <CountdownTimer targetDate={countdownDate} />
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}

