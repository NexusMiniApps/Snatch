import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import GamePage from '~/app/game/page';
import { BasePage } from '~/app/game/BasePage';
import * as auth from '~/server/auth';
import * as PartySocketContext from '~/PartySocketContext';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

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

describe('Game Workflow', () => {
  // Mock date for consistent testing
  let originalDate: typeof Date;
  
  beforeEach(() => {
    originalDate = global.Date;
    const mockDate = new Date('2023-01-01T12:00:00Z');
    global.Date = class extends Date {
      constructor() {
        super();
        return mockDate;
      }
      static now() {
        return mockDate.getTime();
      }
    } as typeof Date;
    
    // Reset mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    global.Date = originalDate;
  });

  // Test the server component
  describe('GamePage', () => {
    test('redirects to home when user is not authenticated', async () => {
      // Mock auth to return null
      vi.spyOn(auth, 'auth').mockResolvedValue(null);
      const { redirect } = await import('next/navigation');
      
      // Render will throw because we're redirecting, so we need to catch it
      try {
        await GamePage();
      } catch (e) {
        // Expected error
      }
      
      expect(redirect).toHaveBeenCalledWith('/');
    });
    
    test('renders BasePage when user is authenticated', async () => {
      // Mock auth to return a session
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
      vi.spyOn(auth, 'auth').mockResolvedValue(mockSession);
      
      // Mock PartySocketProvider to return its children
      vi.spyOn(PartySocketContext, 'PartySocketProvider').mockImplementation(
        ({ children }) => <div data-testid="party-socket-provider">{children}</div>
      );
      
      // Since this is an async server component, we can't directly test the rendered output
      // Instead, we'll check that it doesn't throw and the expected mocks are called
      const result = await GamePage();
      expect(result).toBeDefined();
      expect(PartySocketContext.PartySocketProvider).toHaveBeenCalledWith(
        expect.objectContaining({ 
          session: mockSession, 
          eventType: 'game'
        }),
        expect.anything()
      );
    });
  });
  
  // Test the client component
  describe('BasePage', () => {
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
    
    // Create base mock for usePartySocket
    const createMockUsePartySocket = (overrides = {}) => ({
      isGameOver: false,
      loading: false,
      error: null,
      isLoading: false,
      eventData: {
        id: 'event-1',
        title: 'Test Event',
        description: 'Test Description',
        snatchStartTime: new Date('2023-01-01T13:00:00Z').toISOString(), // 1 hour in the future
      },
      players: [],
      activeTab: 'info' as PartySocketContext.TabType,
      setActiveTab: vi.fn(),
      gamePhase: 'waiting',
      checkSnatchStartTime: vi.fn(),
      ...overrides
    });
    
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
        createMockUsePartySocket()
      );
    });
    
    afterEach(() => {
      vi.useRealTimers();
    });
    
    test('renders loading state when loading', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
        createMockUsePartySocket({ loading: true })
      );
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
    
    test('renders error state when there is an error', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
        createMockUsePartySocket({ error: 'Failed to load', eventData: null })
      );
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByText(/Error: Failed to load/)).toBeInTheDocument();
    });
    
    test('renders "No event data found" when eventData is null', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
        createMockUsePartySocket({ eventData: null })
      );
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByText('No event data found')).toBeInTheDocument();
    });
    
    test('displays the info view by default when game is not active', () => {
      render(<BasePage session={mockSession} />);
      
      // Wait for initial tab setting to complete
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(screen.getByTestId('game-info-view')).toBeInTheDocument();
    });
    
    test('shows info and game tabs during pre-game phase', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
        createMockUsePartySocket({ gamePhase: 'waiting' })
      );
      
      render(<BasePage session={mockSession} />);
      
      // Check that both tabs are shown
      expect(screen.getByText('info')).toBeInTheDocument();
      expect(screen.getByText('game')).toBeInTheDocument();
      expect(screen.queryByText('results')).not.toBeInTheDocument();
    });
    
    test('shows info and results tabs during game over phase', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
        createMockUsePartySocket({ gamePhase: 'gameover' })
      );
      
      render(<BasePage session={mockSession} />);
      
      // Check that both tabs are shown
      expect(screen.getByText('info')).toBeInTheDocument();
      expect(screen.getByText('results')).toBeInTheDocument();
      expect(screen.queryByText('game')).not.toBeInTheDocument();
    });
    
    test('automatically switches to game tab when game becomes active', async () => {
      const setActiveTab = vi.fn();
      const mockUsePartySocket = createMockUsePartySocket({
        gamePhase: 'waiting',
        setActiveTab
      });
      
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(mockUsePartySocket);
      
      // Render the component
      const { rerender } = render(<BasePage session={mockSession} />);
      
      // Complete initial render
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // Update gamePhase to active
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
        ...mockUsePartySocket,
        gamePhase: 'active'
      });
      
      // Re-render with the new state
      rerender(<BasePage session={mockSession} />);
      
      // Check that setActiveTab was called with 'game'
      expect(setActiveTab).toHaveBeenCalledWith('game');
    });
    
    test('automatically switches to results tab when game is over', async () => {
      const setActiveTab = vi.fn();
      const mockUsePartySocket = createMockUsePartySocket({
        gamePhase: 'active',
        setActiveTab
      });
      
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(mockUsePartySocket);
      
      // Render the component
      const { rerender } = render(<BasePage session={mockSession} />);
      
      // Complete initial render
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // Update gamePhase to gameover
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
        ...mockUsePartySocket,
        gamePhase: 'gameover'
      });
      
      // Re-render with the new state
      rerender(<BasePage session={mockSession} />);
      
      // Check that setActiveTab was called with 'results'
      expect(setActiveTab).toHaveBeenCalledWith('results');
    });
    
    test('shows game view when game tab is active and game is not over', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
        createMockUsePartySocket({
          activeTab: 'game',
          gamePhase: 'active'
        })
      );
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByTestId('game-view')).toBeInTheDocument();
    });
    
    test('shows results view when results tab is active and game is over', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
        createMockUsePartySocket({
          activeTab: 'results',
          gamePhase: 'gameover'
        })
      );
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByTestId('game-results-view')).toBeInTheDocument();
    });
    
    test('allows switching tabs by clicking tab buttons', () => {
      const setActiveTab = vi.fn();
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
        createMockUsePartySocket({
          setActiveTab,
          gamePhase: 'waiting'
        })
      );
      
      render(<BasePage session={mockSession} />);
      
      // Click the game tab
      fireEvent.click(screen.getByText('game'));
      
      // Verify setActiveTab was called with 'game'
      expect(setActiveTab).toHaveBeenCalledWith('game');
    });
    
    test('checks snatch start time on component mount', () => {
      const checkSnatchStartTime = vi.fn();
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
        createMockUsePartySocket({ checkSnatchStartTime })
      );
      
      render(<BasePage session={mockSession} />);
      
      // Verify checkSnatchStartTime was called
      expect(checkSnatchStartTime).toHaveBeenCalled();
    });
  });
});
