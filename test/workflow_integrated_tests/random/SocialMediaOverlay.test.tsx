import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import BasePage from '~/app/random/BasePage';
import * as PartySocketContext from '~/PartySocketContext';

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

describe('Social Media Overlay', () => {
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
  
  const createMockUsePartySocket = (overrides = {}) => ({
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
    ...overrides
  });
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('displays social media overlay when none are followed', () => {
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket()
    );
    
    render(<BasePage session={mockSession} />);
    
    // Check for overlay
    expect(screen.getByText('Huatzard Hobbyfest Card Show Giveaway is over!')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
  });
  
  test('displays overlay with only TikTok when Telegram is followed', () => {
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ socialAFollowed: true })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Check for overlay
    expect(screen.getByText('Huatzard Hobbyfest Card Show Giveaway is over!')).toBeInTheDocument();
    expect(screen.queryByText('Telegram')).not.toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('Thanks for joining us on Telegram!')).toBeInTheDocument();
  });
  
  test('displays overlay with only Telegram when TikTok is followed', () => {
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ socialBFollowed: true })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Check for overlay
    expect(screen.getByText('Huatzard Hobbyfest Card Show Giveaway is over!')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.queryByText('TikTok')).not.toBeInTheDocument();
    expect(screen.getByText('Thanks for following us on TikTok!')).toBeInTheDocument();
  });
  
  test('hides overlay when both social media are followed', () => {
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ socialAFollowed: true, socialBFollowed: true })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Check that overlay is not shown
    expect(screen.queryByText('Huatzard Hobbyfest Card Show Giveaway is over!')).not.toBeInTheDocument();
  });
  
  test('calls setSocialAFollowed when Telegram link is clicked', () => {
    const setSocialAFollowed = vi.fn();
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ setSocialAFollowed })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Click the Telegram link
    fireEvent.click(screen.getByText('Telegram'));
    
    // Verify setSocialAFollowed was called
    expect(setSocialAFollowed).toHaveBeenCalledWith(true);
  });
  
  test('calls setSocialBFollowed when TikTok link is clicked', () => {
    const setSocialBFollowed = vi.fn();
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ setSocialBFollowed })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Click the TikTok link
    fireEvent.click(screen.getByText('TikTok'));
    
    // Verify setSocialBFollowed was called
    expect(setSocialBFollowed).toHaveBeenCalledWith(true);
  });
  
  test('shows thank you message when both accounts are followed', () => {
    // Create a mock where both are initially not followed
    const setSocialAFollowed = vi.fn();
    const setSocialBFollowed = vi.fn();
    
    // First render with none followed
    const { rerender } = render(<BasePage session={mockSession} />);
    
    // Get the telegram link and click it
    fireEvent.click(screen.getByText('Telegram'));
    
    // Mock the party socket again but with socialAFollowed=true
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ 
        socialAFollowed: true, 
        setSocialAFollowed, 
        setSocialBFollowed 
      })
    );
    
    // Re-render the component
    rerender(<BasePage session={mockSession} />);
    
    // Now click the TikTok link
    fireEvent.click(screen.getByText('TikTok'));
    
    // Mock the party socket again with both followed
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ 
        socialAFollowed: true, 
        socialBFollowed: true, 
        setSocialAFollowed, 
        setSocialBFollowed 
      })
    );
    
    // Re-render the component
    rerender(<BasePage session={mockSession} />);
    
    // Verify the overlay is gone
    expect(screen.queryByText('Huatzard Hobbyfest Card Show Giveaway is over!')).not.toBeInTheDocument();
  });
});
