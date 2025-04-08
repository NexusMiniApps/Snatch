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

describe('Tab Navigation', () => {
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
    socialAFollowed: true, // Set both to true to hide the overlay for these tests
    socialBFollowed: true,
    setSocialAFollowed: vi.fn(),
    setSocialBFollowed: vi.fn(),
    ...overrides
  });
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('shows all three tabs', () => {
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket()
    );
    
    render(<BasePage session={mockSession} />);
    
    // Check for all three tabs
    expect(screen.getByText('info')).toBeInTheDocument();
    expect(screen.getByText('random')).toBeInTheDocument();
    expect(screen.getByText('results')).toBeInTheDocument();
  });
  
  test('info tab is active by default', () => {
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket()
    );
    
    render(<BasePage session={mockSession} />);
    
    // Check that info view is rendered
    expect(screen.getByTestId('random-info-view')).toBeInTheDocument();
    
    // Check that other views are not rendered
    expect(screen.queryByTestId('random-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('random-results-view')).not.toBeInTheDocument();
  });
  
  test('clicking random tab calls setActiveTab with "random"', () => {
    const setActiveTab = vi.fn();
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ setActiveTab })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Click the random tab
    fireEvent.click(screen.getByText('random'));
    
    // Verify setActiveTab was called with 'random'
    expect(setActiveTab).toHaveBeenCalledWith('random');
  });
  
  test('clicking results tab calls setActiveTab with "results"', () => {
    const setActiveTab = vi.fn();
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ setActiveTab })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Click the results tab
    fireEvent.click(screen.getByText('results'));
    
    // Verify setActiveTab was called with 'results'
    expect(setActiveTab).toHaveBeenCalledWith('results');
  });
  
  test('renders RandomView when random tab is active', () => {
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ activeTab: 'random' })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Check that random view is rendered
    expect(screen.getByTestId('random-view')).toBeInTheDocument();
    
    // Check that other views are not rendered
    expect(screen.queryByTestId('random-info-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('random-results-view')).not.toBeInTheDocument();
  });
  
  test('renders RandomResultsView when results tab is active', () => {
    vi.spyOn(PartySocketContext, 'usePartySocket').mockReturnValue(
      createMockUsePartySocket({ activeTab: 'results' })
    );
    
    render(<BasePage session={mockSession} />);
    
    // Check that results view is rendered
    expect(screen.getByTestId('random-results-view')).toBeInTheDocument();
    
    // Check that other views are not rendered
    expect(screen.queryByTestId('random-info-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('random-view')).not.toBeInTheDocument();
  });
  
  test('simulates a user navigating through all tabs', () => {
    // Start with mock that returns different active tabs depending on calls
    let currentActiveTab = 'info';
    const setActiveTab = vi.fn((tab) => {
      currentActiveTab = tab;
    });
    
    const mockUsePartySocket = () => createMockUsePartySocket({ 
      activeTab: currentActiveTab, 
      setActiveTab 
    });
    
    vi.spyOn(PartySocketContext, 'usePartySocket').mockImplementation(mockUsePartySocket);
    
    const { rerender } = render(<BasePage session={mockSession} />);
    
    // Initially, info view should be shown
    expect(screen.getByTestId('random-info-view')).toBeInTheDocument();
    
    // Click random tab
    fireEvent.click(screen.getByText('random'));
    expect(setActiveTab).toHaveBeenCalledWith('random');
    
    // Update the mock to reflect the new active tab
    vi.spyOn(PartySocketContext, 'usePartySocket').mockImplementation(mockUsePartySocket);
    
    // Re-render with the new state
    rerender(<BasePage session={mockSession} />);
    
    // Now random view should be shown
    expect(screen.getByTestId('random-view')).toBeInTheDocument();
    
    // Click results tab
    fireEvent.click(screen.getByText('results'));
    expect(setActiveTab).toHaveBeenCalledWith('results');
    
    // Update the mock again
    vi.spyOn(PartySocketContext, 'usePartySocket').mockImplementation(mockUsePartySocket);
    
    // Re-render with the new state
    rerender(<BasePage session={mockSession} />);
    
    // Now results view should be shown
    expect(screen.getByTestId('random-results-view')).toBeInTheDocument();
    
    // Click info tab to go back
    fireEvent.click(screen.getByText('info'));
    expect(setActiveTab).toHaveBeenCalledWith('info');
    
    // Update the mock once more
    vi.spyOn(PartySocketContext, 'usePartySocket').mockImplementation(mockUsePartySocket);
    
    // Re-render with the new state
    rerender(<BasePage session={mockSession} />);
    
    // Now info view should be shown again
    expect(screen.getByTestId('random-info-view')).toBeInTheDocument();
  });
});
