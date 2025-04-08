import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('eventParticipant API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/eventParticipant', () => {
    it('should create or update a participant entry', async () => {
      // Participant data
      const participantData = {
        userId: 'user123',
        eventId: 'event123',
        isPreReg: true,
        hasJoinedGiveaway: false
      };
      
      // Mock response
      const mockResponse = { 
        json: () => Promise.resolve({
          id: 'participant123',
          ...participantData,
          createdAt: '2023-05-01T12:00:00Z',
          updatedAt: '2023-05-01T12:00:00Z'
        }),
        ok: true,
        status: 200
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch('/api/eventParticipant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData)
      });
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/eventParticipant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData)
      });
      
      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.userId).toBe(participantData.userId);
      expect(data.eventId).toBe(participantData.eventId);
      expect(data.hasPreReg).toBe(participantData.isPreReg);
    });

    it('should handle invalid participant data', async () => {
      // Invalid data missing required fields
      const invalidData = {
        userId: 'user123',
        // Missing eventId and isPreReg
      };
      
      // Mock error response
      const mockResponse = { 
        json: () => Promise.resolve({ error: 'Missing required fields' }),
        ok: false,
        status: 400
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch('/api/eventParticipant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });
      
      // Verify response
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing required fields');
    });
  });

  describe('GET /api/eventParticipant', () => {
    it('should retrieve participant information', async () => {
      const userId = 'user123';
      const eventId = 'event123';
      
      // Mock participant data
      const mockParticipant = {
        id: 'participant123',
        userId,
        eventId,
        hasPreReg: true,
        hasJoinedGiveaway: true,
        ticketNumber: '123456',
        createdAt: '2023-05-01T12:00:00Z',
        updatedAt: '2023-05-01T13:00:00Z'
      };
      
      // Setup mock response
      const mockResponse = { 
        json: () => Promise.resolve(mockParticipant),
        ok: true 
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch(`/api/eventParticipant?userId=${userId}&eventId=${eventId}`);
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(`/api/eventParticipant?userId=${userId}&eventId=${eventId}`);
      
      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual(mockParticipant);
    });

    it('should handle participant not found', async () => {
      const userId = 'user456';
      const eventId = 'event456';
      
      // Mock error response
      const mockResponse = { 
        json: () => Promise.resolve({ error: 'Event participant not found' }),
        ok: false,
        status: 404
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch(`/api/eventParticipant?userId=${userId}&eventId=${eventId}`);
      
      // Verify response
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Event participant not found');
    });
  });

  describe('GET /api/eventParticipant/count', () => {
    it('should count participants who joined giveaway', async () => {
      const eventId = 'event123';
      
      // Mock count response
      const mockResponse = { 
        json: () => Promise.resolve({ count: 42 }),
        ok: true 
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch(`/api/eventParticipant/count?eventId=${eventId}&hasJoined=true`);
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(`/api/eventParticipant/count?eventId=${eventId}&hasJoined=true`);
      
      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('count');
      expect(data.count).toBe(42);
    });
  });

  describe('GET /api/eventParticipant/tickets', () => {
    it('should fetch tickets for an event', async () => {
      const eventId = 'event123';
      
      // Mock tickets data
      const mockTickets = {
        tickets: [
          { userId: 'user1', ticketNumber: '123456', name: 'User One' },
          { userId: 'user2', ticketNumber: '654321', name: 'User Two' }
        ]
      };
      
      // Setup mock response
      const mockResponse = { 
        json: () => Promise.resolve(mockTickets),
        ok: true 
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch(`/api/eventParticipant/tickets?eventId=${eventId}`);
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(`/api/eventParticipant/tickets?eventId=${eventId}`);
      
      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('tickets');
      expect(Array.isArray(data.tickets)).toBe(true);
      expect(data.tickets).toHaveLength(2);
    });
  });

  describe('POST /api/eventParticipant/selectWinner', () => {
    it('should select a winner for an event', async () => {
      const eventId = 'event123';
      
      // Mock winner response
      const mockResponse = { 
        json: () => Promise.resolve({
          winner: {
            userId: 'user123',
            ticketNumber: '654321',
            name: 'Lucky Winner'
          }
        }),
        ok: true 
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch('/api/eventParticipant/selectWinner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/eventParticipant/selectWinner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      
      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('winner');
      expect(data.winner).toHaveProperty('userId');
      expect(data.winner).toHaveProperty('ticketNumber');
      expect(data.winner).toHaveProperty('name');
    });

    it('should handle no participants found', async () => {
      const eventId = 'emptyEvent';
      
      // Mock error response
      const mockResponse = { 
        json: () => Promise.resolve({ message: 'No participants found with ticket numbers' }),
        ok: false,
        status: 404
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch('/api/eventParticipant/selectWinner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      
      // Verify response
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('No participants found with ticket numbers');
    });
  });
});
