import { render, screen, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { BasePage } from '~/app/game/BasePage';
import * as PartySocketContext from '~/PartySocketContext';

// Mock components
vi.mock('~/components/views/GameInfoView', () => ({
  GameInfoView: () => <div data-testid="game-info-view">Game Info View</div>,
}));

vi.mock('~/components/views/GameView', () => ({
  GameView: () => <div data-testid="game-view">Game View</div>,
}));

vi.mock('~/components/views/GameResultsView', () => ({
  GameResultsView: () => <div data-testid="game-results-view">Game Results View</div>,
}));

// Mock usePalette
vi.mock('~/lib/usePalette', () => ({
  useVibrantPalette: () => ({
    lightVibrant: '#e0e0e0',
    darkVibrant: '#303030',
    muted: '#a0a0a0',
  }),
}));

describe('Game Phase Transitions', () => {
  // Mock dates and timers
  let mockCurrentTime: Date;
  let originalDate: typeof Date;
  
  const mockSession = {
    user: {
      id: 'test-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'Test User',
      phoneNo: BigInt(1234567890),
      countryCode: BigInt(1),
      verified: true,
    }
  };

  beforeEach(() => {
    vi.useFakeTimers();
    originalDate = global.Date;
    
    // Set initial mock time
    mockCurrentTime = new Date('2023-01-01T12:00:00Z');
    
    // Mock Date constructor and Date.now
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          return new originalDate(mockCurrentTime);
        }
        return new originalDate(...args);
      }
      static now() {
        return mockCurrentTime.getTime();
      }
    } as unknown as typeof Date;
  });
  
  afterEach(() => {
    vi.useRealTimers();
    global.Date = originalDate;
  });
  
  // Create mock for usePartySocket
  const createMockUsePartySocket = (overrides = {}) => ({
    isGameOver: false,
    loading: false,
    error: null,
    isLoading: false,
    eventData: {
      id: 'event-1',
      title: 'Test Event',
      description: 'Test Description',
      snatchStartTime: new Date('2023-01-01T12:15:00Z').toISOString(), // 15 minutes in the future
    },
    players: [],
    activeTab: 'info' as PartySocketContext.TabType,
    setActiveTab: vi.fn(),
    gamePhase: 'waiting',
    checkSnatchStartTime: vi.fn(),
    ...overrides
  });

  test('shows info view when game is not starting soon', () => {
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket()
    );
    
    render(<BasePage session={mockSession} />);
    
    // Complete initial render
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByTestId('game-info-view')).toBeInTheDocument();
  });
  
  test('auto-switches to game view when game is starting soon', () => {
    // Set current time to 5 seconds before game starts
    mockCurrentTime = new Date('2023-01-01T12:14:55Z');
    
    const setActiveTab = vi.fn();
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({
        setActiveTab,
        gamePhase: 'waiting'
      })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Allow effects to run
    act(() => {
      vi.runAllTimers();
    });
    
    // Verify setActiveTab was called with 'game'
    expect(setActiveTab).toHaveBeenCalledWith('game');
  });
  
  test('auto-switches to game view when game is active', () => {
    // Set current time to after game has started
    mockCurrentTime = new Date('2023-01-01T12:15:30Z');
    
    const setActiveTab = vi.fn();
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({
        setActiveTab,
        gamePhase: 'active'
      })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Allow effects to run
    act(() => {
      vi.runAllTimers();
    });
    
    // Verify setActiveTab was called with 'game'
    expect(setActiveTab).toHaveBeenCalledWith('game');
  });
  
  test('shows results tab after game is over', () => {
    // Set current time to after game is over (game duration is 1 minute)
    mockCurrentTime = new Date('2023-01-01T12:16:30Z');
    
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({
        gamePhase: 'gameover',
        activeTab: 'results'
      })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Check that the results tab is available
    expect(screen.getByText('results')).toBeInTheDocument();
    // And the game tab is not
    expect(screen.queryByText('game')).not.toBeInTheDocument();
    
    // Check that results view is shown
    expect(screen.getByTestId('game-results-view')).toBeInTheDocument();
  });
  
  test('simulates complete game workflow transition', async () => {
    // Start with waiting phase
    const setActiveTab = vi.fn();
    const mockUsePartySocket = createMockUsePartySocket({
      setActiveTab,
      gamePhase: 'waiting'
    });
    
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(mockUsePartySocket);
    
    const { rerender } = render(<BasePage session={mockSession} />);
    
    // Complete initial render
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Verify info view is shown
    expect(screen.getByTestId('game-info-view')).toBeInTheDocument();
    
    // Transition to game about to start (5 seconds before)
    mockCurrentTime = new Date('2023-01-01T12:14:55Z');
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
      ...mockUsePartySocket,
      activeTab: 'game'
    });
    
    rerender(<BasePage session={mockSession} />);
    
    // Verify game view is shown
    expect(screen.getByTestId('game-view')).toBeInTheDocument();
    
    // Transition to active game
    mockCurrentTime = new Date('2023-01-01T12:15:30Z');
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
      ...mockUsePartySocket,
      gamePhase: 'active',
      activeTab: 'game'
    });
    
    rerender(<BasePage session={mockSession} />);
    
    // Verify game view is still shown
    expect(screen.getByTestId('game-view')).toBeInTheDocument();
    
    // Transition to game over
    mockCurrentTime = new Date('2023-01-01T12:16:30Z');
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
      ...mockUsePartySocket,
      gamePhase: 'gameover',
      activeTab: 'results'
    });
    
    rerender(<BasePage session={mockSession} />);
    
    // Verify results view is shown
    expect(screen.getByTestId('game-results-view')).toBeInTheDocument();
    
    // Verify available tabs are info and results
    expect(screen.getByText('info')).toBeInTheDocument();
    expect(screen.getByText('results')).toBeInTheDocument();
    expect(screen.queryByText('game')).not.toBeInTheDocument();
  });
});
