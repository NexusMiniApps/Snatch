import { NextRequest, NextResponse } from "next/server";
import prisma from '~/server/db/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get("eventId");
  const hasJoined = searchParams.get("hasJoined") === "true";

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  try {
    const count = await prisma.eventParticipants.count({
      where: {
        eventId,
        hasJoinedGiveaway: hasJoined,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting participants:", error);
    return NextResponse.json(
      { error: "Failed to count participants" },
      { status: 500 }
    );
  }
}