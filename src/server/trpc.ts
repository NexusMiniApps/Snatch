import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import { createTRPCContext } from './api/trpc';

const t = initTRPC.context<typeof createTRPCContext>().create();

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      user: ctx.session.user,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated); 