import { vi } from 'vitest';

// Common mock setup for all game workflow tests

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock components
vi.mock('~/components/views/GameInfoView', () => ({
  GameInfoView: ({ palette, session }) => (
    <div data-testid="game-info-view" data-palette={JSON.stringify(palette)} data-session={session.user.id}>
      Game Info View
    </div>
  ),
}));

vi.mock('~/components/views/GameView', () => ({
  GameView: ({ palette, snatchStartTime }) => (
    <div data-testid="game-view" data-palette={JSON.stringify(palette)} data-start-time={snatchStartTime.toISOString()}>
      Game View
    </div>
  ),
}));

vi.mock('~/components/views/GameResultsView', () => ({
  GameResultsView: ({ palette, resultsPlayers }) => (
    <div data-testid="game-results-view" data-palette={JSON.stringify(palette)} data-players={resultsPlayers.length}>
      Game Results View
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
  snatchStartTime: new Date('2023-01-01T12:15:00Z').toISOString(),
  ...overrides
});
