// For fetching top scores for an event by eventId

// Example of how to fetch top scores for an event:
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const eventId = (await params).eventId;
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit')) || 10; // Default limit to 10

  try {
    const topScores = await prisma.eventUserScores.findMany({
      where: {
        eventId,
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(topScores, { status: 200 });
  } catch (error) {
    console.error('Error fetching top scores:', error);
    return NextResponse.json(
      { error: 'Error fetching top scores' },
      { status: 500 }
    );
  }
}