// For adding or updating a user's score for an event

// Example of how to fetch top scores for an event:
// async function fetchTopScores(eventId: string, limit: number = 10) {
//     try {
//       const res = await fetch(`/api/eventUserScore/${eventId}?limit=${limit}`);
  
//       if (!res.ok) {
//         console.log(res); // Log the response in case of an error
//         throw new Error("Failed to fetch top scores");
//       }
  
//       const data = await res.json();
//       console.log("Fetched top scores:", data); // Log fetched data
  
//       return data;
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         console.error("Error fetching top scores:", err.message);
//       } else {
//         console.error("An unexpected error occurred");
//       }
//     }
//   }
  

import { NextResponse } from 'next/server';
import prisma from '~/server/db/client';
import { NextApiRequest, NextApiResponse } from 'next';

interface UserScore {
  userId: string;
  score: number;
  eventId: string;
}

interface EventUserScoresResponse {
  success: boolean;
  data?: UserScore[];
  error?: string;
}

export async function POST(request: Request) {
  try {
    const { eventId, userId, score } = await request.json() as UserScore;

    if (!eventId || !userId || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        score: score,
        updatedAt: new Date(),
      },
      create: {
        eventId: eventId,
        userId: userId,
        score: score,
      },
    });

    return NextResponse.json(eventUserScore, { status: 200 });
  } catch (error) {
    console.error('Error in addOrUpdateScore:', error);
    return NextResponse.json(
      { error: 'Error updating score' },
      { status: 500 }
    );
  }
}