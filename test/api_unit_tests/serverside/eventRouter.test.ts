import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventRouter } from '~/server/api/routers/event';
import { createTRPCRouter } from '~/server/api/trpc';
import { EventStatus } from '@prisma/client';

// Mock event data
const mockEvent = {
  id: 'event-id-123',
  name: 'Test Event',
  description: 'Test Description',
  status: 'ACTIVE' as EventStatus,
  startTime: new Date(),
  snatchStartTime: new Date(),
  location: 'Test Location',
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerId: 'user-id-123'
};

// Mock event with details
const mockEventWithDetails = {
  name: 'Test Event',
  description: 'Test Description',
  location: 'Test Location',
  startTime: new Date(),
  status: 'ACTIVE' as EventStatus,
  owner: {
    name: 'Test User',
    id: 'user-id-123'
  },
  participants: [{ id: 'participant-1' }, { id: 'participant-2' }]
};

// Mock database operations
const mockDb = {
  event: {
    create: vi.fn().mockResolvedValue(mockEvent),
    findFirst: vi.fn().mockResolvedValue(mockEvent),
    findUnique: vi.fn().mockResolvedValue(mockEventWithDetails)
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
  event: eventRouter,
});

describe('Event Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hello', () => {
    it('should return a greeting', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      const result = await caller.event.hello({ text: 'World' });
      
      expect(result).toEqual({ greeting: 'Hello World' });
    });
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const startTime = new Date();
      const snatchStartTime = new Date(startTime.getTime() + 3600000); // 1 hour later
      
      await caller.event.create({
        name: 'Test Event',
        description: 'Test Description',
        status: 'ACTIVE' as EventStatus,
        startTime,
        snatchStartTime,
        location: 'Test Location'
      });
      
      expect(mockDb.event.create).toHaveBeenCalledTimes(1);
      expect(mockDb.event.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Event',
          description: 'Test Description',
          status: 'ACTIVE',
          startTime,
          snatchStartTime,
          location: 'Test Location',
          owner: { connect: { id: 'user-id-123' } }
        }
      });
    });

    it('should throw unauthorized error if no session', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      await expect(caller.event.create({
        name: 'Test Event',
        description: 'Test Description',
        status: 'ACTIVE' as EventStatus,
        startTime: new Date(),
        snatchStartTime: new Date(),
        location: 'Test Location'
      })).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('getLatest', () => {
    it('should fetch the latest event', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.event.getLatest();
      
      expect(mockDb.event.findFirst).toHaveBeenCalledTimes(1);
      expect(mockDb.event.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      });
      
      expect(result).toEqual(mockEvent);
    });

    it('should throw unauthorized error if no session', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      await expect(caller.event.getLatest()).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('getSecretMessage', () => {
    it('should return a secret message', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.event.getSecretMessage();
      
      expect(result).toBe('you can now see this secret message!');
    });

    it('should throw unauthorized error if no session', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      await expect(caller.event.getSecretMessage()).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('getById', () => {
    it('should fetch an event by ID with details', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.event.getById({ eventId: 'event-id-123' });
      
      expect(mockDb.event.findUnique).toHaveBeenCalledTimes(1);
      expect(mockDb.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-id-123' },
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
        }
      });
      
      expect(result).toEqual(mockEventWithDetails);
    });

    it('should throw error if event is not found', async () => {
      mockDb.event.findUnique.mockResolvedValueOnce(null);
      
      const caller = appRouter.createCaller(createMockContext());
      
      await expect(caller.event.getById({ eventId: 'nonexistent-id' }))
        .rejects.toThrow('Event not found');
    });

    it('should throw unauthorized error if no session', async () => {
      const caller = appRouter.createCaller(createMockContext(false));
      
      await expect(caller.event.getById({ eventId: 'event-id-123' }))
        .rejects.toThrow('UNAUTHORIZED');
    });
  });
});
