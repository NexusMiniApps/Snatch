import { EventStatus } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const eventRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
  .input(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.nativeEnum(EventStatus), // Ensure this matches your Prisma Enum
      startTime: z.date(),
      location: z.string().optional(),
      snatchStartTime: z.date(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    return ctx.db.event.create({
      data: {
        name: input.name,
        description: input.description ?? null, // Optional field
        status: input.status, // Required enum field
        owner: { connect: { id: ctx.session.user.id } }, // Link to the logged-in user
        startTime: input.startTime,
        location: input.location ?? null,
        snatchStartTime: input.snatchStartTime,
      },
    });
  }),
  

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const event = await ctx.db.event.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return event ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getById: protectedProcedure
    .input(z.object({
      eventId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: {
          id: input.eventId,
        },
        select: {
          name: true,
          description: true,
          location: true,
          startTime: true,
          status: true,
          owner: {
            select: {
              name: true,
              id: true,
            }
          },
          participants: {
            select: {
              id: true,
            }
          }
        },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      return event;
    }),
});


