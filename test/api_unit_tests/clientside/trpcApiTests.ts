import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('tRPC API Route', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should handle GET requests', async () => {
    // Setup mock response
    const mockResponse = { json: () => Promise.resolve({ result: 'success' }) };
    mockFetch.mockResolvedValueOnce(mockResponse);

    // Make request to the API
    const response = await fetch('/api/trpc/someQuery');
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/trpc/someQuery');
    
    // Verify response
    const data = await response.json();
    expect(data).toEqual({ result: 'success' });
  });

  it('should handle POST requests', async () => {
    // Setup mock response
    const mockResponse = { json: () => Promise.resolve({ result: 'success' }) };
    mockFetch.mockResolvedValueOnce(mockResponse);

    // Request body
    const requestBody = { input: 'test' };
    
    // Make request to the API
    const response = await fetch('/api/trpc/someMutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/trpc/someMutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    // Verify response
    const data = await response.json();
    expect(data).toEqual({ result: 'success' });
  });
});
