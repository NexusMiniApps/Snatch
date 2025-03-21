import { NextResponse } from "next/server";
import prisma from "~/server/db/client";

// The GET function receives a Request and a context with params
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log("Fetching event with ID:", id);

  try {
    const event = await prisma.event.findUnique({
      where: { id }, // id is a UUID string
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    console.log("Fetched event data:", event);

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error retrieving event:", error);
    return NextResponse.json(
      { error: "Error retrieving event" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json() as { snatchStartTime?: string };
    const snatchStartTime = body.snatchStartTime;
    
    if (!snatchStartTime) {
      return NextResponse.json(
        { error: 'snatchStartTime is required' },
        { status: 400 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: {
        id: id
      },
      data: {
        snatchStartTime: new Date(snatchStartTime)
      }
    });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error('Error updating snatchStartTime:', error);
    return NextResponse.json(
      { error: 'Error updating snatchStartTime' },
      { status: 500 }
    );
  }
}
