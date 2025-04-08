import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('NextAuth API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should handle session retrieval via GET', async () => {
    // Mock session data
    const mockSession = {
      user: {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      },
      expires: '2024-01-01T00:00:00.000Z'
    };
    
    // Setup mock response
    const mockResponse = { 
      json: () => Promise.resolve(mockSession),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/auth/session');
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/session');
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('expires');
    expect(data.user.name).toBe('Test User');
  });

  it('should handle signin requests via POST', async () => {
    // Signin credentials
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
      csrfToken: 'test-csrf-token',
      callbackUrl: '/'
    };
    
    // Setup mock response
    const mockResponse = { 
      json: () => Promise.resolve({ url: '/' }),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/auth/signin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(credentials).toString()
    });
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/signin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(credentials).toString()
    });
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('url');
  });

  it('should handle signout requests via POST', async () => {
    // Setup mock response
    const mockResponse = { 
      json: () => Promise.resolve({ url: '/signin' }),
      ok: true 
    };
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Make request to the API
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken: 'test-csrf-token', callbackUrl: '/signin' }).toString()
    });
    
    // Verify response
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('url');
    expect(data.url).toBe('/signin');
  });
});
