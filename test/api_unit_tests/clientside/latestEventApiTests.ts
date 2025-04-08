import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('latestEvent API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should fetch the latest event without type filter', async () => {
    // Mock event data
    const mockEvent = {
      id: 'event123',
      name: 'Test Event',
      description: 'Test Description',
      eventType: 'GAME',
      status: 'ACTIVE',
      startTime: '2023-05-01T12:00:00Z',
      snatchStartTime: '2023-05-01T13:00:00Z',
      location: 'Test Location'
    };
    
    // Setup mock response
    const mockResponse = { 
      json: () => Promise.resolve(mockEvent),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/latestEvent');
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/latestEvent');
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toEqual(mockEvent);
  });

  it('should fetch the latest event with a specific type', async () => {
    // Mock event data
    const mockEvent = {
      id: 'event456',
      name: 'Random Event',
      description: 'Random Description',
      eventType: 'RANDOM',
      status: 'ACTIVE',
      startTime: '2023-05-02T12:00:00Z',
      snatchStartTime: '2023-05-02T13:00:00Z',
      location: 'Random Location'
    };
    
    // Setup mock response
    const mockResponse = { 
      json: () => Promise.resolve(mockEvent),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API with type filter
    const response = await fetch('/api/latestEvent?type=random');
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/latestEvent?type=random');
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toEqual(mockEvent);
  });

  it('should handle case when no events are found', async () => {
    // Setup mock response for not found
    const mockResponse = { 
      json: () => Promise.resolve({ error: 'No events found' }),
      ok: false,
      status: 404
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/latestEvent');
    
    // Verify response indicates not found
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('No events found');
  });

  it('should handle server errors', async () => {
    // Setup mock response for server error
    const mockResponse = { 
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
      ok: false,
      status: 500
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/latestEvent');
    
    // Verify response indicates server error
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal Server Error');
  });
});
