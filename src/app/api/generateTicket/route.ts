import { NextResponse } from 'next/server';
import prisma from '~/server/db/client';

interface TicketRequest {
  userId: string;
  eventId: string;
}

// Generate a random 6-digit number as a string
function generateSixDigitNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { eventId, userId } = await request.json() as TicketRequest;

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the user already has a ticket for this event
    const existingParticipant = await prisma.eventParticipants.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: userId,
        },
      },
      select: {
        ticketNumber: true,
      },
    });

    if (existingParticipant?.ticketNumber) {
      // User already has a ticket, return it
      return NextResponse.json({ ticketNumber: existingParticipant.ticketNumber });
    }

    // Generate a unique ticket number
    let isUnique = false;
    let ticketNumber = '';
    
    while (!isUnique) {
      ticketNumber = generateSixDigitNumber();
      
      // Check if this ticket number is already used for this event
      const existingTicket = await prisma.eventParticipants.findFirst({
        where: {
          eventId: eventId,
          ticketNumber: ticketNumber,
        },
      });
      
      if (!existingTicket) {
        isUnique = true;
      }
    }

    return NextResponse.json({ ticketNumber });
  } catch (error) {
    console.error('Error generating ticket number:', error);
    return NextResponse.json(
      { error: 'Error generating ticket number' },
      { status: 500 }
    );
  }
}