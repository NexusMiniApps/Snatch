import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { LoginForm } from "~/components/LoginForm";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  // If user has valid session, redirect to coffee page
  if (session?.user) {
    redirect("/coffee");
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Welcome
          </h1>
          <LoginForm />
        </div>
      </main>
    </HydrateClient>
  );
"use client";

