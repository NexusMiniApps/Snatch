import { NextResponse } from "next/server";
import prisma from "~/server/db/client";

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = (await request.json()) as { eventId: string };
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { message: "Event ID is required" },
        { status: 400 },
      );
    }

    // Get all participants with ticket numbers for this event
    const participants = await prisma.eventParticipants.findMany({
      where: {
        eventId: eventId,
        hasJoinedGiveaway: true,
        ticketNumber: {
          not: null,
        },
      },
      select: {
        userId: true,
        ticketNumber: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (participants.length === 0) {
      return NextResponse.json(
        { message: "No participants found with ticket numbers" },
        { status: 404 },
      );
    }

    // Randomly select one winner
    const randomIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[randomIndex];

    // Update the event with the winner info
    await prisma.event.update({
      where: { id: eventId },
      data: {
        winnerUserId: winner?.userId,
        winnerTicket: winner?.ticketNumber,
      },
    });

    return NextResponse.json({
      winner: {
        userId: winner?.userId,
        ticketNumber: winner?.ticketNumber,
        name: winner?.user.name,
      },
    });
  } catch (error) {
    console.error("Error selecting winner:", error);
    return NextResponse.json(
      { message: "Failed to select winner" },
      { status: 500 },
    );
  }
}
