import { NextResponse } from "next/server";
import prisma from "~/server/db/client";
import { type Event, EventType } from '@prisma/client'; // Import Event and EventType

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventTypeParam = searchParams.get("type"); // Get 'type' query param

  console.log("[latestEvent API] Received type parameter:", eventTypeParam);

  try {
    let whereCondition = {}; // Start with an empty where condition

    // If eventTypeParam exists and is a valid EventType, add it to the condition
    if (eventTypeParam) {
      const normalizedType = eventTypeParam.toUpperCase();
      if (Object.values(EventType).includes(normalizedType as EventType)) {
          whereCondition = {
              ...whereCondition,
              eventType: normalizedType as EventType, // Filter by type
              // Optional: Add status filter if needed, e.g., only 'ACTIVE' or 'PENDING'
              // status: 'ACTIVE'
          };
          console.log("[latestEvent API] Filtering by type:", normalizedType);
      } else {
          console.warn("[latestEvent API] Invalid event type provided:", eventTypeParam);
          // Optionally return an error if type is invalid, or proceed without type filter
          // return NextResponse.json({ error: "Invalid event type provided" }, { status: 400 });
      }
    }

    const latestEvent = await prisma.event.findFirst({
      where: whereCondition, // Apply the constructed where condition
      orderBy: {
        updatedAt: 'desc', // Still order by latest updated
      },
    });

    if (!latestEvent) {
      const message = eventTypeParam 
        ? `No events found for type: ${eventTypeParam}`
        : "No events found";
      return NextResponse.json({ error: message }, { status: 404 });
    }

    console.log("[latestEvent API] Found latest event:", latestEvent);
    // Return the full event object
    return NextResponse.json(latestEvent);

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
