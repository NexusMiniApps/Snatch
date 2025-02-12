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
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.event.create({
        data: {
          name: input.name,
          description: input.description ?? null, // Optional field
          status: input.status, // Required enum field
          owner: { connect: { id: ctx.session.user.id } }, // Link to the logged-in user
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
});
