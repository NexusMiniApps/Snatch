import { NextResponse } from "next/server";
import prisma from "~/server/db/client";
import { type Event } from "@prisma/client"; // Import the Event type

export async function GET() {
  try {
    const latestEvent = await prisma.event.findFirst({
      orderBy: {
        updatedAt: "desc", // Order by the last updated timestamp in descending order
      },
      // No 'select' field means all fields are selected by default
    });

    if (!latestEvent) {
      return NextResponse.json({ error: "No events found" }, { status: 404 });
    }

    // Return the full event object
    return NextResponse.json(latestEvent);
  } catch (error) {
    console.error("Error fetching latest event:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 },
    );
  }
}
