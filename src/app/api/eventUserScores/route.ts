// For adding or updating a user's score for an event

// Example of how to add or update a user's score for an event:
// async function addOrUpdateScore(eventId: string, userId: string, score: number) {
//     try {
//       const res = await fetch("/api/eventUserScore", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ eventId, userId, score }),
//       });
  
//       if (!res.ok) {
//         console.log(res); // Log the response in case of an error
//         throw new Error("Failed to update score");
//       }
  
//       const data = await res.json();
//       console.log("Updated score:", data); // Log the updated data
  
//       return data;
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         console.error("Error updating score:", err.message);
//       } else {
//         console.error("An unexpected error occurred");
//       }
//     }
//   }
  

import { NextResponse } from 'next/server';
import prisma from '~/server/db/client';

interface UserScore {
  userId: string;
  score: number;
  eventId: string;
}

// interface EventUserScoresResponse {
//   success: boolean;
//   data?: UserScore[];
//   error?: string;
// }

export async function POST(request: Request) {
  try {
    const { eventId, userId, score } = (await request.json()) as UserScore;

    console.log("eventId", eventId);
    console.log("userId", userId);
    console.log("score", score);

    if (!eventId || !userId || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (typeof eventId !== 'string' || typeof userId !== 'string' || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'Invalid data types' },
        { status: 400 }
      );
    }

    // Upsert the user's score for the event
    const eventUserScore = await prisma.eventUserScores.upsert({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: userId,
        },
      },
      update: {
        score: BigInt(score),
        updatedAt: new Date(),
      },
      create: {
        eventId: eventId,
        userId: userId,
        score: BigInt(score),
      },
    });

    return NextResponse.json(eventUserScore, { status: 200 });
  } catch (error) {
    console.error('Error while updating score:', {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
    });
    return NextResponse.json(
      { error: 'Error updating score' },
      { status: 500 }
    );
  }
}