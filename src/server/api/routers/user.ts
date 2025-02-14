import { EventStatus } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { cookies } from "next/headers";

// model User {
//   id              String            @id @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
//   phoneNo         BigInt            @unique
//   countryCode     BigInt
//   name            String
//   verified        Boolean
//   createdAt       DateTime          @default(now()) @db.Timestamptz(6)
//   updatedAt       DateTime          @updatedAt @db.Timestamptz(6)
//   events          Event[]
//   eventUserScores EventUserScores[]
// }

// model Event {
//     id              String            @id @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
//     name            String
//     description     String?
//     status          EventStatus
//     createdAt       DateTime          @default(now()) @db.Timestamptz(6)
//     updatedAt       DateTime          @updatedAt @db.Timestamptz(6)
//     owner           User              @relation(fields: [ownerId], references: [id], onDelete: NoAction, onUpdate: NoAction)
//     eventUserScores EventUserScores[]
//     location        String?
//   }
  
//   model EventUserScores {
//     id        String   @id @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
//     eventId   String   @db.Uuid
//     userId    String   @db.Uuid
//     score     BigInt
//     createdAt DateTime @default(now()) @db.Timestamptz(6)
//     updatedAt DateTime @updatedAt @db.Timestamptz(6)
//     Event     Event    @relation(fields: [eventId], references: [id])
//     User      User     @relation(fields: [userId], references: [id])
//   }

export const userRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phoneNo: z.string().min(1),
        countryCode: z.string().min(1),
        verified: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists or create new user
      const user = await ctx.db.user.upsert({
        where: {
          phoneNo: BigInt(input.phoneNo),
        },
        update: {
          name: input.name,
        },
        create: {
          phoneNo: BigInt(input.phoneNo),
          countryCode: BigInt(input.countryCode),
          name: input.name,
          verified: input.verified ?? false,
        },
      });

      // Always create a new session
      const session = await ctx.db.userSessions.create({
        data: {
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Instead of using cookies() directly, return the session ID
      // to be set on the client side
      return {
        user,
        sessionId: session.id.toString(),
        sessionExpiry: session.expiresAt,
      };
    }),

    getUser: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.user.findUnique({
            where: { id: ctx.session.user.id },
        });
    }),

    addUserToEvent: protectedProcedure
    .input(
        z.object({
        eventId: z.string().min(1),
        userId: z.string().min(1),
        })
    )
    .mutation(async ({ ctx, input }) => {
        return ctx.db.user.update({
            where: {
                id: input.userId
            },
            data: {
                eventUserScores: {
                    create: {
                        eventId: input.eventId,
                        score: BigInt(0)
                    }
                }
            }
        });
    }),
});