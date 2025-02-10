
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import Vibrant from "node-vibrant";
import Image from "next/image";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();
  

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center px-4 gap-y-6">
      <div className="border-solid border-2 border-black rounded-md p-1 w-full h-60">
          <div className="relative rounded-md w-full h-full">
          <Image
          className="object-cover rounded-md"
            src="/images/coffee.jpg"
            alt="Fresh bread"
            fill
          />
          </div>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Bread
          </h1>

      </main>
    </HydrateClient>
  );
}

