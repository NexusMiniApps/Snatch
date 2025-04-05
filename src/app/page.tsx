import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { LoginForm } from "~/components/views/LoginForm";
import { HydrateClient } from "~/trpc/server";
import Image from "next/image";
import { fetchEvent } from "~/lib/registrationUtils";

export default async function Home() {
  const session = await auth();
  let eventData = null; // Initialize eventData outside try block
  let error: unknown = null; // Initialize error outside try block

  // If user is logged in, try fetching event data
  if (session?.user) {
    try {
      eventData = await fetchEvent(); // Only fetchEvent is inside the try
    } catch (err) { // Use a different name for the catch block variable
      console.error(
        "[Home Page] Error fetching event data:", 
        err,
      );
      error = err; // Assign caught error to the outer variable
      // Optional: Show an error message or handle differently if fetch fails
      // eventData will remain null if fetch fails
    }

    // --- Redirect logic AFTER the try...catch --- 
    // Check if eventData was successfully fetched
    if (eventData) {
      console.log(
        "[Home Page] User logged in, attempting redirect based on event type:",
        eventData.eventType,
      );
      if (eventData.eventType === "GAME") {
        redirect("/game"); // This will now throw NEXT_REDIRECT outside the catch
      } else if (eventData.eventType === "CHOSEN") {
        redirect("/chosen"); // This will now throw NEXT_REDIRECT outside the catch
      } else if (eventData.eventType === "RANDOM") {
        redirect("/random"); // This will now throw NEXT_REDIRECT outside the catch
      } else {
        console.error("[Home Page] Unknown event type, cannot redirect:", eventData.eventType);
        // Stay on the page or redirect to a default if type is unknown
      }
    } else if (!eventData && !error) { // Now 'error' is accessible here
        // This case means fetchEvent succeeded but returned null/undefined data
        console.error("[Home Page] Fetched event data is invalid.");
    } // If there was an error during fetch, eventData is null, and error is logged. Stay on page.

  } else {
    // User is not logged in, proceed to show login form
    console.log("[Home Page] No session found, showing login form.");
  }

  // Render login page content ONLY if not redirected and no critical error occurred
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
