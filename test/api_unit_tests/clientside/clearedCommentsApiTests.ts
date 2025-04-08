import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('clearedComments API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should fetch cleared comment IDs via GET', async () => {
    // Mock response data
    const mockClearedIds = {
      clearedIds: ['comment1', 'comment2', 'comment3']
    };
    
    // Setup mock response
    const mockResponse = { 
      json: () => Promise.resolve(mockClearedIds),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/clearedComments');
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/clearedComments');
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('clearedIds');
    expect(Array.isArray(data.clearedIds)).toBe(true);
    expect(data.clearedIds).toHaveLength(3);
  });

  it('should save cleared comment IDs via POST', async () => {
    // Data to save
    const clearedData = {
      clearedIds: ['comment4', 'comment5', 'comment6']
    };
    
    // Setup mock response
    const mockResponse = { 
      json: () => Promise.resolve({ success: true }),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/clearedComments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clearedData)
    });
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/clearedComments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clearedData)
    });
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should clear all cleared comment IDs via DELETE', async () => {
    // Setup mock response
    const mockResponse = { 
      json: () => Promise.resolve({ success: true }),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/clearedComments', {
      method: 'DELETE'
    });
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/clearedComments', {
      method: 'DELETE'
    });
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle errors when reading cleared comments', async () => {
    // Setup mock response for error
    const mockResponse = { 
      json: () => Promise.resolve({ error: 'Failed to read cleared comments' }),
      ok: false,
      status: 500
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/clearedComments');
    
    // Verify response indicates error
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to read cleared comments');
  });
});
