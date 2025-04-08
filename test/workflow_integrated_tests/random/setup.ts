import { vi } from 'vitest';

// Common mock setup for all random workflow tests

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock components
vi.mock('~/components/views/RandomInfoView', () => ({
  RandomInfoView: ({ palette, session }) => (
    <div data-testid="random-info-view" data-palette={JSON.stringify(palette)} data-session={session.user.id}>
      Random Info View
    </div>
  ),
}));

vi.mock('~/components/views/RandomView', () => ({
  RandomView: () => (
    <div data-testid="random-view">
      Random View
    </div>
  ),
}));

vi.mock('~/components/views/RandomResultsView', () => ({
  RandomResultsView: () => (
    <div data-testid="random-results-view">
      Random Results View
    </div>
  ),
}));

// Mock usePalette
vi.mock('~/lib/usePalette', () => ({
  useVibrantPalette: () => ({
    lightVibrant: '#e0e0e0',
    darkVibrant: '#303030',
    muted: '#a0a0a0',
  }),
}));

// Helper for creating a mock session
export const createMockSession = () => ({
  user: {
    id: 'test-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'Test User',
    phoneNo: BigInt(1234567890),
    countryCode: BigInt(1),
    verified: true,
  }
});

// Helper for creating a mock event data
export const createMockEventData = (overrides = {}) => ({
  id: 'event-1',
  title: 'Test Event',
  description: 'Test Description',
  snatchStartTime: new Date().toISOString(),
  ...overrides
});

// Helper for creating mock party socket context
export const createMockPartySocketContext = (overrides = {}) => ({
  loading: false,
  error: null,
  eventData: createMockEventData(),
  activeTab: 'info',
  setActiveTab: vi.fn(),
  socialAFollowed: false,
  socialBFollowed: false,
  setSocialAFollowed: vi.fn(),
  setSocialBFollowed: vi.fn(),
  ...overrides
});
