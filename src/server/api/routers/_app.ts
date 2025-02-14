import { createTRPCRouter } from '~/server/api/trpc';
import { eventRouter } from './event';
import { userRouter } from './user';
import { newFeatureRouter } from './newFeature';

export const appRouter = createTRPCRouter({
  event: eventRouter,
  user: userRouter,
  newFeature: newFeatureRouter,
});

export type AppRouter = typeof appRouter; 