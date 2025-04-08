import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userRouter } from '~/server/api/routers/user';
import { createTRPCRouter } from '~/server/api/trpc';

// Mock dependencies
const mockUser = {
  id: 'user-id-123',
  name: 'Test User',
  phoneNo: BigInt('1234567890'),
  countryCode: BigInt('1'),
  verified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  teleUsername: 'testuser'
};

const mockSession = {
  id: 'session-id-123',
  userId: 'user-id-123',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
};

// Mock database operations
const mockDb = {
  user: {
    upsert: vi.fn().mockResolvedValue(mockUser),
    findUnique: vi.fn().mockResolvedValue(mockUser),
    update: vi.fn().mockResolvedValue(mockUser)
  },
  userSessions: {
    create: vi.fn().mockResolvedValue(mockSession)
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
  user: userRouter,
});

describe('User Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user and session', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      const result = await caller.user.createUser({
        name: 'Test User',
        phoneNo: '1234567890',
        countryCode: '1',
        teleUsername: 'testuser'
      });

      expect(mockDb.user.upsert).toHaveBeenCalledTimes(1);
      expect(mockDb.user.upsert).toHaveBeenCalledWith({
        where: {
          phoneNo: BigInt('1234567890')
        },
        update: {
          name: 'Test User',
          teleUsername: 'testuser'
        },
        create: {
          phoneNo: BigInt('1234567890'),
          countryCode: BigInt('1'),
          name: 'Test User',
          verified: false,
          teleUsername: 'testuser'
        }
      });
      
      expect(mockDb.userSessions.create).toHaveBeenCalledTimes(1);
      expect(mockDb.userSessions.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id-123',
          expiresAt: expect.any(Date)
        }
      });

      expect(result).toEqual({
        user: mockUser,
        sessionId: mockSession.id.toString(),
        sessionExpiry: mockSession.expiresAt
      });
    });
  });

  describe('getUser', () => {
    it('should fetch the current user', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.user.getUser();
      
      expect(mockDb.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-123' }
      });
      
      expect(result).toEqual(mockUser);
    });

    it('should throw unauthorized error if no session', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      await expect(caller.user.getUser()).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('addUserToEvent', () => {
    it('should add user to event with initial score of 0', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      await caller.user.addUserToEvent({
        eventId: 'event-id-123',
        userId: 'user-id-123'
      });
      
      expect(mockDb.user.update).toHaveBeenCalledTimes(1);
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: {
          id: 'user-id-123'
        },
        data: {
          eventUserScores: {
            create: {
              eventId: 'event-id-123',
              score: BigInt(0)
            }
          }
        }
      });
    });

    it('should throw unauthorized error if no session', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      await expect(caller.user.addUserToEvent({
        eventId: 'event-id-123',
        userId: 'user-id-123'
      })).rejects.toThrow('UNAUTHORIZED');
    });
  });
});
