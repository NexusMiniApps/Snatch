import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { LoginForm } from "~/components/LoginForm";
import { HydrateClient } from "~/trpc/server";
import Image from "next/image";

export default async function Home() {
  const session = await auth();

  // If user has valid session, redirect to coffee page
  if (session?.user) {
    console.log("[Client] User has valid session");
    redirect("/giveaway");
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
