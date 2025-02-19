import { NextResponse } from "next/server";
import prisma from "~/server/db/client";

// The GET function receives a Request and a context with params
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
