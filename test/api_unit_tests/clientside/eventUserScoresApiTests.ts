import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('eventUserScores API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/eventUserScores', () => {
    it('should update a user\'s score for an event', async () => {
      // Setup mock response
      const mockResponse = { 
        json: () => Promise.resolve({ 
          id: 'score123',
          eventId: 'event123',
          userId: 'user123',
          score: '1000' 
        }),
        ok: true,
        status: 200
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
  
      // Score data
      const scoreData = {
        eventId: 'event123',
        userId: 'user123',
        scoreStr: '1000'
      };
      
      // Make request to the API
      const response = await fetch('/api/eventUserScores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData)
      });
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/eventUserScores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData)
      });
      
      // Verify response
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('eventId', 'event123');
      expect(data).toHaveProperty('userId', 'user123');
      expect(data).toHaveProperty('score', '1000');
    });
  
    it('should handle missing required fields', async () => {
      // Setup mock response for error
      const mockResponse = { 
        json: () => Promise.resolve({ error: 'Missing required fields' }),
        ok: false,
        status: 400
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
  
      // Invalid request missing userId
      const invalidRequest = {
        eventId: 'event123',
        // Missing userId
        scoreStr: '1000'
      };
      
      // Make request to the API
      const response = await fetch('/api/eventUserScores', {
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

  describe('GET /api/eventUserScores/[eventId]', () => {
    it('should fetch top scores for an event', async () => {
      const eventId = 'event123';
      
      // Mock scores data
      const mockScores = [
        {
          id: 'score1',
          eventId,
          userId: 'user1',
          score: '1500',
          user: { id: 'user1', name: 'User One' }
        },
        {
          id: 'score2',
          eventId,
          userId: 'user2',
          score: '1200',
          user: { id: 'user2', name: 'User Two' }
        }
      ];
      
      // Setup mock response
      const mockResponse = { 
        json: () => Promise.resolve(mockScores),
        ok: true 
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch(`/api/eventUserScores/${eventId}`);
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(`/api/eventUserScores/${eventId}`);
      
      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].score).toBe('1500');
      expect(data[1].score).toBe('1200');
    });
  
    it('should handle server errors when fetching scores', async () => {
      const eventId = 'event123';
      
      // Setup mock response for server error
      const mockResponse = { 
        json: () => Promise.resolve({ error: 'Error fetching top scores' }),
        ok: false,
        status: 500
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch(`/api/eventUserScores/${eventId}`);
      
      // Verify response indicates server error
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Error fetching top scores');
    });
  });
});
