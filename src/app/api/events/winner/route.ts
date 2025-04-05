import { NextResponse } from "next/server";
import prisma from "~/server/db/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { error: "eventId query parameter is required" },
      { status: 400 },
    );
  }

  console.log("Fetching winner for event ID:", eventId);

  try {
    // 1. Find the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        winnerUserId: true,
        winnerTicket: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 },
      );
    }

    // 2. Check if a winner has been drawn
    if (!event.winnerUserId || !event.winnerTicket) {
      return NextResponse.json(
        { message: "No winner has been drawn for this event yet" },
        { status: 200 }, // 200 OK, but indicate no winner
      );
    }

    // 3. Find the winner's user details (specifically the name)
    const winnerUser = await prisma.user.findUnique({
      where: { id: event.winnerUserId },
      select: {
        name: true,
      },
    });

    if (!winnerUser) {
      // This case might indicate data inconsistency
      console.error(
        `Winner user with ID ${event.winnerUserId} not found for event ${eventId}`,
      );
      return NextResponse.json(
        { error: "Winner user data not found" },
        { status: 404 },
      );
    }

    // 4. Construct the response payload
    const winnerData = {
      userId: event.winnerUserId,
      ticketNumber: event.winnerTicket,
      name: winnerUser.name,
    };

    console.log("Found winner data:", winnerData);

    return NextResponse.json({ winner: winnerData });
  } catch (error) {
    console.error("Error retrieving winner:", error);
    // Log the specific error for debugging
    if (error instanceof Error) {
        console.error(error.message);
    }
    return NextResponse.json(
      { error: "Error retrieving winner information" },
      { status: 500 },
    );
  }
}
