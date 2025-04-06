import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "~/server/db/client";
import { Prisma } from "@prisma/client";

// Define the expected request body schema using Zod for validation
const createEventSchema = z.object({
  name: z.string().min(1, "Event name cannot be empty"),
  description: z.string().min(1, "Description cannot be empty"),
  type: z.enum(["game", "chosen", "random"]),
  startTime: z.string().optional(),
  snatchStartTime: z.string().optional(),
  location: z.string().optional(),
});

// Define the type based on the schema
type EventRequestData = z.infer<typeof createEventSchema>;

export async function POST(request: Request) {
  try {
    // Explicitly type the request body
    const body = (await request.json()) as unknown;

    // Validate the request body
    const validationResult = createEventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 },
      );
    }

    // Now body is properly typed through Zod validation
    const { name, description, type, startTime, snatchStartTime, location } =
      validationResult.data;

    // Convert type to uppercase to match enum values in database
    const eventTypeValue = type.toUpperCase();

    // Search for existing events by event name
    const existingEvent = await prisma.event.findFirst({
      where: { name },
    });

    let event;
    const now = new Date();

    // Define specific EventType enum to match database
    type EventTypeEnum = "GAME" | "CHOSEN" | "RANDOM";

    // Using Prisma.EventCreateInput to ensure type safety
    const eventData = {
      name,
      description,
      // Cast as EventTypeEnum for strong typing
      eventType: eventTypeValue as EventTypeEnum,
      status: "PENDING" as const,
      startTime: startTime
        ? new Date(startTime)
        : new Date(now.getTime() + 60 * 60 * 1000),
      snatchStartTime: snatchStartTime
        ? new Date(snatchStartTime)
        : new Date(now.getTime() + 2 * 60 * 60 * 1000),
      location: location ?? null,
    };

    if (existingEvent) {
      // Update the existing event - using correct prisma typing
      event = await prisma.event.update({
        where: { id: existingEvent.id },
        data: eventData,
      });

      console.log("Updated existing event:", event.id);
    } else {
      // Create a new event - using correct prisma typing
      event = await prisma.event.create({
        data: eventData,
      });

      console.log("Created new event:", event.id);
    }

    // Return the ID of the created/updated event
    return NextResponse.json(
      {
        eventId: event.id,
        isNewEvent: !existingEvent,
      },
      { status: existingEvent ? 200 : 201 },
    );
  } catch (error) {
    console.error("Error creating/updating event:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 },
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 },
    );
  }
}
