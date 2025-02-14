import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const newFeatureRouter = createTRPCRouter({
  exampleProcedure: protectedProcedure
    .input(z.object({ data: z.string() }))
    .query(({ input }) => {
      return { message: `Received: ${input.data}` };
    }),
}); 