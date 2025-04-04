import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { LoginForm } from "~/components/views/LoginForm";
import { HydrateClient } from "~/trpc/server";
import Image from "next/image";
import { fetchEvent } from "~/lib/registrationUtils";

export default async function Home() {
  const session = await auth();
  const eventData = await fetchEvent();

  // If user has valid session, redirect to coffee page
  if (session?.user) {
    console.log('eventData', eventData);
    if (eventData.eventType === "GAME") {
      redirect("/test");
    } else if (eventData.eventType === "CHOSEN") {
      redirect("/chosen");
    } else if (eventData.eventType === "RANDOM") {
      redirect("/test");
    } else {
      console.log("No event type found");
    }

  }
  console.log("[Client] User does not have valid session");

  return (
    <HydrateClient>
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-200 to-orange-700">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
          <Image
            src="/images/snatch.png"
            alt="Snatch"
            className="h-auto w-96"
            width={1920}
            height={500}
          />

          <LoginForm />
        </div>
      </main>
    </HydrateClient>
  );
}
