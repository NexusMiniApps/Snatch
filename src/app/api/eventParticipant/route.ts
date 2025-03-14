import { NextResponse } from 'next/server';
import prisma from '~/server/db/client';

interface EventParticipant {
  userId: string;
  eventId: string;
  isPreReg: boolean;
  hasJoinedGiveaway: boolean;
  ticketNumber?: string;
}

type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonValue[] 
  | { [key: string]: JsonValue };

interface SerializableObject {
  [key: string]: JsonValue | bigint | Date | SerializableObject | SerializableObject[];
}

export async function POST(request: Request) {
  try {
    const { eventId, userId, isPreReg, hasJoinedGiveaway, ticketNumber} = (await request.json()) as EventParticipant;

    if (!eventId || !userId || isPreReg === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (typeof eventId !== 'string' || typeof userId !== 'string' || typeof isPreReg !== 'boolean' || typeof hasJoinedGiveaway !== 'boolean' || (ticketNumber && typeof ticketNumber !== 'string')) {
      return NextResponse.json(
        { error: 'Invalid data types' },
        { status: 400 }
      );
    }

    // Upsert the event participant
    const eventParticipant = await prisma.eventParticipants.upsert({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: userId,
        },
      },
      update: {
        hasPreReg: isPreReg,
        hasJoinedGiveaway: hasJoinedGiveaway,
        updatedAt: new Date(),
        ticketNumber: ticketNumber,
      },
      create: {
        eventId: eventId,
        userId: userId,
        hasPreReg: isPreReg,
        hasJoinedGiveaway: hasJoinedGiveaway,
      },
    });

    return NextResponse.json(eventParticipant, { status: 200 });
  } catch (error) {
    console.error('Error while updating event participant:', {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
    });
    return NextResponse.json(
      { error: 'Error updating event participant' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const userId = searchParams.get('userId');

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const eventParticipant = await prisma.eventParticipants.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: userId,
        },
      },
    });

    if (!eventParticipant) {
      return NextResponse.json(
        { error: 'Event participant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(eventParticipant, { status: 200 });
  } catch (error) {
    console.error('Error while retrieving event participant:', {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
    });
    return NextResponse.json(
      { error: 'Error retrieving event participant' },
      { status: 500 }
    );
  }
}