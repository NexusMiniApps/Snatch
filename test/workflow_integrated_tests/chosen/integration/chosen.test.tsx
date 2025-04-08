import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ChosenPage from '~/app/chosen/page';
import BasePage from '~/app/chosen/BasePage';
import * as auth from '~/server/auth';
import * as PartySocketContext from '~/PartySocketContext';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock components
vi.mock('~/components/views/ChosenInfoView', () => ({
  ChosenInfoView: () => <div data-testid="chosen-info-view">Info View</div>,
}));

vi.mock('~/components/views/CommentView', () => ({
  CommentView: () => <div data-testid="comment-view">Comment View</div>,
}));

vi.mock('~/components/views/VoteComment', () => ({
  VoteComment: () => <div data-testid="vote-comment">Vote View</div>,
}));

// Mock usePalette
vi.mock('~/lib/usePalette', () => ({
  useVibrantPalette: () => ({
    lightVibrant: '#e0e0e0',
    darkVibrant: '#303030',
    muted: '#a0a0a0',
  }),
}));

describe('Chosen Workflow', () => {
  // Test the server component
  describe('ChosenPage', () => {
    test('redirects to home when user is not authenticated', async () => {
      // Mock auth to return null
      vi.spyOn(auth, 'auth').mockResolvedValue(null);
      const { redirect } = await import('next/navigation');
      
      // Render will throw because we're redirecting, so we need to catch it
      try {
        await ChosenPage();
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
      
      // Render will throw in our test environment since ChosenPage is an async component
      // In a real test, you'd want to use a library like next-page-tester
      // This is a simplified version for illustration
      const result = await ChosenPage();
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
      players: [],
    };
    
    beforeEach(() => {
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
      expect(screen.getByTestId('chosen-info-view')).toBeInTheDocument();
    });
    
    test('switches to comments tab when clicked', () => {
      render(<BasePage session={mockSession} />);
      
      // Click the comments tab
      fireEvent.click(screen.getByText('comments'));
      
      // Verify setActiveTab was called
      expect(mockUsePartySocket.setActiveTab).toHaveBeenCalledWith('comments');
    });
    
    test('switches to vote tab when clicked', () => {
      render(<BasePage session={mockSession} />);
      
      // Click the vote tab
      fireEvent.click(screen.getByText('vote'));
      
      // Verify setActiveTab was called
      expect(mockUsePartySocket.setActiveTab).toHaveBeenCalledWith('vote');
    });
    
    test('renders CommentView when comments tab is active', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
        ...mockUsePartySocket,
        activeTab: 'comments',
      });
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByTestId('comment-view')).toBeInTheDocument();
    });
    
    test('renders VoteComment when vote tab is active', () => {
      vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue({
        ...mockUsePartySocket,
        activeTab: 'vote',
      });
      
      render(<BasePage session={mockSession} />);
      expect(screen.getByTestId('vote-comment')).toBeInTheDocument();
    });
    
    // Add more tests for specific interactions within each tab view if needed
  });
});
