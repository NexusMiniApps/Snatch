import { vi } from 'vitest';
import { type PrismaClient } from '@prisma/client';
import { EventStatus } from '@prisma/client';

// Mock database
export const mockDb = {
  user: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn()
  },
  userSessions: {
    create: vi.fn()
  },
  event: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn()
  },
  eventUserScores: {
    upsert: vi.fn(),
    findMany: vi.fn()
  }
} as unknown as PrismaClient;

// Mock user data
export const mockUser = {
  id: 'user-id-123',
  name: 'Test User',
  phoneNo: BigInt('1234567890'),
  countryCode: BigInt('1'),
  verified: false,
  teleUsername: 'testuser',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock session data
export const mockSession = {
  id: BigInt('987654321'),
  userId: 'user-id-123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date()
};

// Mock event data
export const mockEvent = {
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
export const mockEventWithDetails = {
  name: 'Test Event',
  description: 'Test Description',
  location: 'Test Location',
  startTime: new Date(),
  status: 'ACTIVE' as EventStatus,
  owner: {
    name: 'Test User',
    id: 'user-id-123'
  },
  participants: []
};

// Mock event user score
export const mockEventUserScore = {
  id: 'score-id-123',
  eventId: 'event-id-123',
  userId: 'user-id-123',
  score: BigInt(100),
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock top scores
export const mockTopScores = [
  {
    id: 'score-id-1',
    eventId: 'event-id-123',
    userId: 'user-id-1',
    score: BigInt(300),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-id-1', name: 'User One' }
  },
  {
    id: 'score-id-2',
    eventId: 'event-id-123',
    userId: 'user-id-2',
    score: BigInt(200),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-id-2', name: 'User Two' }
  },
  {
    id: 'score-id-3',
    eventId: 'event-id-123',
    userId: 'user-id-3',
    score: BigInt(100),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-id-3', name: 'User Three' }
  }
];