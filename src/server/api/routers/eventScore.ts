import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const eventScoreRouter = createTRPCRouter({
  // Add or update a user's score for an event
  addOrUpdateScore: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        userId: z.string().uuid(),
        score: z.number().int().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, userId, score } = input;

      // Upsert the user's score for the event
      const eventUserScore = await ctx.db.eventUserScores.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        update: {
          score,
          updatedAt: new Date(),
        },
        create: {
          eventId,
          userId,
          score,
        },
      });

      return eventUserScore;
    }),

  // Fetch the top-k scores for a specific event
  getTopKScores: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        limit: z.number().int().min(1).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { eventId, limit } = input;

      const topScores = await ctx.db.eventUserScores.findMany({
        where: {
          eventId,
        },
        orderBy: {
          score: "desc",
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

      return topScores;
    }),
});
