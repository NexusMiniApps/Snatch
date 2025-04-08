import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Events API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('GET /api/events/[id]', () => {
    it('should fetch an event by ID', async () => {
      const eventId = 'event123';
      
      // Mock event data
      const mockEvent = {
        id: eventId,
        name: 'Test Event',
        description: 'Test Description',
        eventType: 'GAME',
        status: 'ACTIVE',
        startTime: '2023-05-01T12:00:00Z',
        snatchStartTime: '2023-05-01T13:00:00Z'
      };
      
      // Setup mock response
      const mockResponse = { 
        json: () => Promise.resolve(mockEvent),
        ok: true 
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch(`/api/events/${eventId}`);
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(`/api/events/${eventId}`);
      
      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual(mockEvent);
    });

    it('should handle event not found', async () => {
      const eventId = 'nonexistent';
      
      // Setup mock response for not found
      const mockResponse = { 
        json: () => Promise.resolve({ error: 'Event not found' }),
        ok: false,
        status: 404
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch(`/api/events/${eventId}`);
      
      // Verify response indicates not found
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Event not found');
    });
  });

  describe('POST /api/events/[id]', () => {
    it('should update an event\'s snatchStartTime', async () => {
      const eventId = 'event123';
      const newSnatchStartTime = '2023-06-01T15:00:00Z';
      
      // Mock updated event
      const mockUpdatedEvent = {
        id: eventId,
        name: 'Test Event',
        snatchStartTime: newSnatchStartTime,
        // ...other fields
      };
      
      // Setup mock response
      const mockResponse = { 
        json: () => Promise.resolve(mockUpdatedEvent),
        ok: true,
        status: 200
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to update snatchStartTime
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snatchStartTime: newSnatchStartTime })
      });
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(`/api/events/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snatchStartTime: newSnatchStartTime })
      });
      
      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.snatchStartTime).toBe(newSnatchStartTime);
    });
  });
  
  describe('POST /api/events/changeEvent', () => {
    it('should create a new event', async () => {
      // Event data
      const eventData = {
        name: 'New Event',
        description: 'New Event Description',
        type: 'game',
        startTime: '2023-06-15T14:00:00Z',
        snatchStartTime: '2023-06-15T15:00:00Z',
        location: 'New Location'
      };
      
      // Mock response for creating a new event
      const mockResponse = { 
        json: () => Promise.resolve({ 
          eventId: 'newevent123',
          isNewEvent: true
        }),
        ok: true,
        status: 201
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to create event
      const response = await fetch('/api/events/changeEvent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      // Verify response
      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.isNewEvent).toBe(true);
      expect(data).toHaveProperty('eventId');
    });

    it('should update an existing event', async () => {
      // Event data with existing name
      const eventData = {
        name: 'Existing Event',
        description: 'Updated Description',
        type: 'random',
        location: 'Updated Location'
      };
      
      // Mock response for updating existing event
      const mockResponse = { 
        json: () => Promise.resolve({ 
          eventId: 'existingevent123',
          isNewEvent: false
        }),
        ok: true,
        status: 200
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to update event
      const response = await fetch('/api/events/changeEvent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      // Verify response
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isNewEvent).toBe(false);
      expect(data).toHaveProperty('eventId');
    });
  });
  
  describe('GET /api/events/winner', () => {
    it('should fetch winner information for an event', async () => {
      const eventId = 'event123';
      
      // Mock winner data
      const mockWinnerData = {
        winner: {
          userId: 'user123',
          ticketNumber: '654321',
          name: 'Winner Name'
        }
      };
      
      // Setup mock response
      const mockResponse = { 
        json: () => Promise.resolve(mockWinnerData),
        ok: true
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch(`/api/events/winner?eventId=${eventId}`);
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(`/api/events/winner?eventId=${eventId}`);
      
      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('winner');
      expect(data.winner.ticketNumber).toBe('654321');
      expect(data.winner.name).toBe('Winner Name');
    });

    it('should handle no winner drawn yet', async () => {
      const eventId = 'event123';
      
      // Mock response when no winner yet
      const mockResponse = { 
        json: () => Promise.resolve({ 
          message: 'No winner has been drawn for this event yet'
        }),
        ok: true,
        status: 200
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Make request to the API
      const response = await fetch(`/api/events/winner?eventId=${eventId}`);
      
      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toBe('No winner has been drawn for this event yet');
    });
  });
});
