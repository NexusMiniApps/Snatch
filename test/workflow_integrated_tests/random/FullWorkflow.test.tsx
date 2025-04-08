import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import BasePage from '~/app/random/BasePage';
import * as PartySocketContext from '~/PartySocketContext';
import { createMockSession, createMockPartySocketContext } from './setup';

describe('Full Random Workflow', () => {
  const mockSession = createMockSession();
  let currentState: any = {
    activeTab: 'info',
    socialAFollowed: false,
    socialBFollowed: false,
  };
  
  // Mock implementation that reflects state changes
  const mockImplementation = () => {
    return createMockPartySocketContext({
      ...currentState,
      setActiveTab: (tab: string) => {
        currentState.activeTab = tab;
      },
      setSocialAFollowed: (value: boolean) => {
        currentState.socialAFollowed = value;
      },
      setSocialBFollowed: (value: boolean) => {
        currentState.socialBFollowed = value;
      },
    });
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state for each test
    currentState = {
      activeTab: 'info',
      socialAFollowed: false,
      socialBFollowed: false,
    };
    vi.spyOn(PartySocketContext, 'usePartySocket').mockImplementation(mockImplementation);
  });
  
  test('simulates complete user journey through random workflow', () => {
    const { rerender } = render(<BasePage session={mockSession} />);
    
    // Step 1: User sees social media overlay
    expect(screen.getByText('Huatzard Hobbyfest Card Show Giveaway is over!')).toBeInTheDocument();
    
    // Step 2: User clicks on Telegram link
    fireEvent.click(screen.getByText('Telegram'));
    
    // Re-render to update the view
    rerender(<BasePage session={mockSession} />);
    
    // Verify Telegram is followed and message is shown
    expect(currentState.socialAFollowed).toBe(true);
    expect(screen.getByText('Thanks for joining us on Telegram!')).toBeInTheDocument();
    
    // Step 3: User clicks on TikTok link
    fireEvent.click(screen.getByText('TikTok'));
    
    // Re-render to update the view
    rerender(<BasePage session={mockSession} />);
    
    // Verify both social media are followed and overlay is gone
    expect(currentState.socialBFollowed).toBe(true);
    expect(screen.queryByText('Huatzard Hobbyfest Card Show Giveaway is over!')).not.toBeInTheDocument();
    
    // Step 4: Now the user sees the info view and tabs
    expect(screen.getByTestId('random-info-view')).toBeInTheDocument();
    
    // Step 5: User clicks on random tab
    fireEvent.click(screen.getByText('random'));
    
    // Re-render to update the view
    rerender(<BasePage session={mockSession} />);
    
    // Verify random view is shown
    expect(currentState.activeTab).toBe('random');
    expect(screen.getByTestId('random-view')).toBeInTheDocument();
    
    // Step 6: User clicks on results tab
    fireEvent.click(screen.getByText('results'));
    
    // Re-render to update the view
    rerender(<BasePage session={mockSession} />);
    
    // Verify results view is shown
    expect(currentState.activeTab).toBe('results');
    expect(screen.getByTestId('random-results-view')).toBeInTheDocument();
    
    // Step 7: User goes back to info tab
    fireEvent.click(screen.getByText('info'));
    
    // Re-render to update the view
    rerender(<BasePage session={mockSession} />);
    
    // Verify info view is shown again
    expect(currentState.activeTab).toBe('info');
    expect(screen.getByTestId('random-info-view')).toBeInTheDocument();
  });
  
  test('allows viewing content without following social media (for testing purposes)', () => {
    // Change the initial state to have both social media followed
    currentState.socialAFollowed = true;
    currentState.socialBFollowed = true;
    
    render(<BasePage session={mockSession} />);
    
    // Verify social media overlay is not shown
    expect(screen.queryByText('Huatzard Hobbyfest Card Show Giveaway is over!')).not.toBeInTheDocument();
    
    // Verify info view is shown
    expect(screen.getByTestId('random-info-view')).toBeInTheDocument();
    
    // User can immediately interact with tabs
    fireEvent.click(screen.getByText('random'));
    expect(currentState.activeTab).toBe('random');
  });
});
