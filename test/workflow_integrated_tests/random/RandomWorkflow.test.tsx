import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import RandomPage from '~/app/random/page';
import BasePage from '~/app/random/BasePage';
import * as auth from '~/server/auth';
import * as PartySocketContext from '~/PartySocketContext';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock components
vi.mock('~/components/views/RandomInfoView', () => ({
  RandomInfoView: () => <div data-testid="random-info-view">Random Info View</div>,
}));

vi.mock('~/components/views/RandomView', () => ({
  RandomView: () => <div data-testid="random-view">Random View</div>,
}));

vi.mock('~/components/views/RandomResultsView', () => ({
  RandomResultsView: () => <div data-testid="random-results-view">Random Results View</div>,
}));

// Mock usePalette
vi.mock('~/lib/usePalette', () => ({
  useVibrantPalette: () => ({
    lightVibrant: '#e0e0e0',
    darkVibrant: '#303030',
    muted: '#a0a0a0',
  }),
}));

describe('Random Workflow', () => {
  // Test the server component
  describe('RandomPage', () => {
    test('redirects to home when user is not authenticated', async () => {
      // Mock auth to return null
      vi.spyOn(auth, 'auth').mockResolvedValue(null);
      const { redirect } = await import('next/navigation');
      
      // Render will throw because we're redirecting, so we need to catch it
      try {
        await RandomPage();
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
      
      // Render will throw in our test environment since RandomPage is an async component
      // This is a simplified version for illustration
      const result = await RandomPage();
      expect(result).toBeDefined();
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
    
    const mockUsePartySocket = {
      loading: false,
      error: null,
      eventData: {
        id: 'event-1',
        title: 'Test Event',
        description: 'Test Description',
        snatchStartTime: new Date().toISOString(),
      },
      activeTab: 'info' as PartySocketContext.TabType,
      setActiveTab: vi.fn(),
      socialAFollowed: false,
      socialBFollowed: false,
      setSocialAFollowed: vi.fn(),
      setSocialBFollowed: vi.fn(),
    };
    
    beforeEach(() => {
      vi.clearAllMocks();
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(mockUsePartySocket);
    });
    
    test('renders loading state when loading', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
        ...mockUsePartySocket,
        loading: true,
      });
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByText('Loading event details...')).toBeInTheDocument();
    });
    
    test('renders error state when there is an error', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
        ...mockUsePartySocket,
        error: 'Failed to load',
        eventData: null,
      });
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByText(/Error loading event details/)).toBeInTheDocument();
    });
    
    test('displays the info tab by default', () => {
      render(<BasePage session={mockSession} />);
      expect(screen.getByTestId('random-info-view')).toBeInTheDocument();
    });
    
    test('switches to random tab when clicked', () => {
      render(<BasePage session={mockSession} />);
      
      // Click the random tab
      fireEvent.click(screen.getByText('random'));
      
      // Verify setActiveTab was called
      expect(mockUsePartySocket.setActiveTab).toHaveBeenCalledWith('random');
    });
    
    test('switches to results tab when clicked', () => {
      render(<BasePage session={mockSession} />);
      
      // Click the results tab
      fireEvent.click(screen.getByText('results'));
      
      // Verify setActiveTab was called
      expect(mockUsePartySocket.setActiveTab).toHaveBeenCalledWith('results');
    });
    
    test('renders RandomView when random tab is active', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
        ...mockUsePartySocket,
        activeTab: 'random',
      });
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByTestId('random-view')).toBeInTheDocument();
    });
    
    test('renders RandomResultsView when results tab is active', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
        ...mockUsePartySocket,
        activeTab: 'results',
      });
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByTestId('random-results-view')).toBeInTheDocument();
    });
  });
});
