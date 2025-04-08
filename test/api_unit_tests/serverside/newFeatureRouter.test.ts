import { describe, it, expect, vi } from 'vitest';
import { newFeatureRouter } from '~/server/api/routers/newFeature';
import { createTRPCRouter } from '~/server/api/trpc';

// Mock context
const createMockContext = (withUser = true) => ({
  db: {},
  session: withUser ? {
    user: {
      id: 'user-id-123',
      name: 'Test User'
    }
  } : null
});

// Create a testable router
const appRouter = createTRPCRouter({
  newFeature: newFeatureRouter,
});

describe('New Feature Router', () => {
  describe('exampleProcedure', () => {
    it('should return a message with the input data', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.newFeature.exampleProcedure({
        data: 'test data'
      });
      
      expect(result).toEqual({ message: 'Received: test data' });
    });

    it('should throw unauthorized error if no session', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      await expect(caller.newFeature.exampleProcedure({
        data: 'test data'
      })).rejects.toThrow('UNAUTHORIZED');
    });
  });
});
