import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('saveComment API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should save a new comment via POST', async () => {
    // Setup mock response
    const mockResponse = { 
      json: () => Promise.resolve({ 
        message: 'Comment saved successfully',
        savedComments: [{ username: 'test', comment: 'test comment' }] 
      }),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    // Comment data
    const commentData = {
      username: 'test',
      profilePictureUrl: 'https://example.com/avatar.jpg',
      comment: 'test comment',
      tags: ['tag1', 'tag2']
    };
    
    // Make request to the API
    const response = await fetch('/api/saveComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/saveComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.message).toBe('Comment saved successfully');
  });

  it('should retrieve saved comments via GET', async () => {
    // Setup mock response with saved comments
    const mockComments = [
      {
        username: 'user1',
        profilePictureUrl: 'https://example.com/avatar1.jpg',
        comment: 'comment 1',
        tags: ['tag1']
      },
      {
        username: 'user2',
        profilePictureUrl: 'https://example.com/avatar2.jpg',
        comment: 'comment 2',
        tags: ['tag2', 'tag3']
      }
    ];
    
    const mockResponse = { 
      json: () => Promise.resolve({ savedComments: mockComments }),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/saveComment');
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/saveComment');
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.savedComments).toEqual(mockComments);
  });

  it('should clear all saved comments via DELETE', async () => {
    // Setup mock response
    const mockResponse = { 
      json: () => Promise.resolve({ message: 'All saved comments cleared successfully' }),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/saveComment', {
      method: 'DELETE'
    });
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/saveComment', {
      method: 'DELETE'
    });
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.message).toBe('All saved comments cleared successfully');
  });

  it('should handle invalid comment format', async () => {
    // Setup mock response for error
    const mockResponse = { 
      json: () => Promise.resolve({ message: 'Invalid comment format' }),
      ok: false,
      status: 400
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    // Invalid comment data (missing required fields)
    const invalidData = {
      username: 'test',
      // Missing profilePictureUrl, comment, and tags
    };
    
    // Make request to the API
    const response = await fetch('/api/saveComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });
    
    // Verify response indicates error
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe('Invalid comment format');
  });
});
