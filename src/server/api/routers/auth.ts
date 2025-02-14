import { TRPCError } from "@trpc/server";
import { z } from "zod";
import twilio from "twilio";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

interface TwilioError extends Error {
  code: number;
  status: number;
  moreInfo: string;
  details?: unknown;
}

const formatPhoneNumber = (phone: string): string => {
  // Add + prefix if not present (since we removed it in the frontend)
  return phone.startsWith('+') ? phone : `+${phone}`;
};

// Generate a random 6-digit code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const authRouter = createTRPCRouter({
  sendVerificationCode: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Format phone number to E.164 format
        const formattedPhone = formatPhoneNumber(input.phoneNumber);

        // Check if user exists
        const existingUser = await ctx.db.user.findFirst({
          where: {
            phoneNo: BigInt(formattedPhone.slice(1)), // Remove + and convert to BigInt
          },
        });

        if (!existingUser) {
          // Create new user if doesn't exist
          await ctx.db.user.create({
            data: {
              name: input.name,
              phoneNo: BigInt(formattedPhone.slice(1)),
              countryCode: BigInt(formattedPhone.slice(1, 3)), // Extract country code
              verified: false,
            },
          });
        }

        try {
          // Send verification code via Twilio Verify WhatsApp
          const verification = await twilioClient.verify.v2
            .services(env.TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({
              to: formattedPhone,
              channel: "whatsapp",
            });

          return {
            success: true,
            status: verification.status,
            channel: "whatsapp",
          };
        } catch (twilioError) {
          console.error("Twilio WhatsApp Error:", twilioError);
          
          // Handle Twilio specific errors
          if ((twilioError as TwilioError).code === 21608) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "This phone number needs to be verified in the Twilio console first. Please contact support.",
            });
          }
          
          if ((twilioError as TwilioError).code === 63003) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Please send 'join plenty-drawn' to +14155238886 on WhatsApp to enable verification.",
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send WhatsApp message. Please try again later.",
          });
        }
      } catch (error) {
        // If it's already a TRPCError, just rethrow it
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("Error sending verification code:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred. Please try again later.",
        });
      }
    }),

  verifyCode: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10),
        code: z.string().length(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const formattedPhone = formatPhoneNumber(input.phoneNumber);

        // Verify the code with Twilio
        const verification = await twilioClient.verify.v2
          .services(env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({
            to: formattedPhone,
            code: input.code,
          });

        if (verification.status === "approved") {
          // Update user verification status
          await ctx.db.user.update({
            where: {
              phoneNo: BigInt(formattedPhone.slice(1)),
            },
            data: {
              verified: true,
            },
          });

          return {
            success: true,
            message: "Phone number verified successfully",
          };
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code",
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error verifying code:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify code",
        });
      }
    }),
}); 