import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventScoreRouter } from '~/server/api/routers/eventScore';
import { createTRPCRouter } from '~/server/api/trpc';

// Mock event score data
const mockEventUserScore = {
  id: 'score-id-123',
  eventId: 'event-id-123',
  userId: 'user-id-123',
  score: 100,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock top scores data
const mockTopScores = [
  {
    id: 'score-id-123',
    eventId: 'event-id-123',
    userId: 'user-id-123',
    score: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-id-123', name: 'Test User 1' }
  },
  {
    id: 'score-id-456',
    eventId: 'event-id-123',
    userId: 'user-id-456',
    score: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-id-456', name: 'Test User 2' }
  },
  {
    id: 'score-id-789',
    eventId: 'event-id-123',
    userId: 'user-id-789',
    score: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-id-789', name: 'Test User 3' }
  }
];

// Mock database operations
const mockDb = {
  eventUserScores: {
    upsert: vi.fn().mockResolvedValue(mockEventUserScore),
    findMany: vi.fn().mockResolvedValue(mockTopScores)
  }
};

// Mock context
const createMockContext = (withUser = true) => ({
  db: mockDb,
  session: withUser ? {
    user: {
      id: 'user-id-123',
      name: 'Test User'
    }
  } : null
});

// Create a testable router
const appRouter = createTRPCRouter({
  eventScores: eventScoreRouter,
});

describe('Event Score Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addOrUpdateScore', () => {
    it('should add a score for a user and event', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.eventScores.addOrUpdateScore({
        eventId: 'event-id-123',
        userId: 'user-id-123',
        score: 100
      });
      
      expect(mockDb.eventUserScores.upsert).toHaveBeenCalledTimes(1);
      expect(mockDb.eventUserScores.upsert).toHaveBeenCalledWith({
        where: {
          eventId_userId: {
            eventId: 'event-id-123',
            userId: 'user-id-123'
          }
        },
        update: {
          score: 100,
          updatedAt: expect.any(Date)
        },
        create: {
          eventId: 'event-id-123',
          userId: 'user-id-123',
          score: 100
        }
      });
      
      expect(result).toEqual(mockEventUserScore);
    });

    it('should throw unauthorized error if no session', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      await expect(caller.eventScores.addOrUpdateScore({
        eventId: 'event-id-123',
        userId: 'user-id-123',
        score: 100
      })).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('getTopKScores', () => {
    it('should fetch top scores for an event', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.eventScores.getTopKScores({
        eventId: 'event-id-123',
        limit: 3
      });
      
      expect(mockDb.eventUserScores.findMany).toHaveBeenCalledTimes(1);
      expect(mockDb.eventUserScores.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event-id-123' },
        orderBy: { score: 'desc' },
        take: 3,
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      expect(result).toEqual(mockTopScores);
      expect(result).toHaveLength(3);
      expect(result[0].score).toBeGreaterThan(result[1].score);
      expect(result[1].score).toBeGreaterThan(result[2].score);
    });

    it('should use default limit of 10 if not provided', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      await caller.eventScores.getTopKScores({
        eventId: 'event-id-123'
      });
      
      expect(mockDb.eventUserScores.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10
        })
      );
    });

    it('should throw unauthorized error if no session', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      await expect(caller.eventScores.getTopKScores({
        eventId: 'event-id-123'
      })).rejects.toThrow('UNAUTHORIZED');
    });
  });
});
