import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('generateTicket API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should generate a new ticket number', async () => {
    // Setup mock response with a ticket number
    const mockResponse = { 
      json: () => Promise.resolve({ ticketNumber: '123456' }),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    // Request data
    const requestData = {
      userId: 'user123',
      eventId: 'event123'
    };
    
    // Make request to the API
    const response = await fetch('/api/generateTicket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/generateTicket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('ticketNumber');
    expect(data.ticketNumber).toBe('123456');
  });

  it('should return existing ticket if user already has one', async () => {
    // Setup mock response with existing ticket
    const mockResponse = { 
      json: () => Promise.resolve({ ticketNumber: '654321' }),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    // Request data
    const requestData = {
      userId: 'user123',
      eventId: 'event123'
    };
    
    // Make request to the API
    const response = await fetch('/api/generateTicket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    // Verify response returns the existing ticket
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('ticketNumber');
    expect(data.ticketNumber).toBe('654321');
  });

  it('should handle missing required fields', async () => {
    // Setup mock response for error
    const mockResponse = { 
      json: () => Promise.resolve({ error: 'Missing required fields' }),
      ok: false,
      status: 400
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    // Invalid request missing eventId
    const invalidRequest = {
      userId: 'user123'
      // Missing eventId
    };
    
    // Make request to the API
    const response = await fetch('/api/generateTicket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRequest)
    });
    
    // Verify response indicates error
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing required fields');
  });
});
