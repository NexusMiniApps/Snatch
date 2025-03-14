import { NextResponse } from "next/server";
import prisma from "~/server/db/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { message: "Event ID is required" },
      { status: 400 },
    );
  }

  try {
    const tickets = await prisma.eventParticipants.findMany({
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

    // Format the response
    const formattedTickets = tickets.map((ticket) => ({
      userId: ticket.userId,
      ticketNumber: ticket.ticketNumber,
      name: ticket.user.name,
    }));

    return NextResponse.json({ tickets: formattedTickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { message: "Failed to fetch tickets" },
      { status: 500 },
    );
  }
}
