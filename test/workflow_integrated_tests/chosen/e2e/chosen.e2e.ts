import { test, expect } from '@playwright/test';

test.describe('Chosen Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication to ensure we're logged in
    await page.route('**/api/auth/session', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'test-id',
            name: 'Test User',
            verified: true,
          }
        }),
      });
    });
    
    // Mock any API calls needed for the chosen page
    await page.route('**/api/events/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'event-1',
          title: 'Test Event',
          description: 'Test Event Description',
          snatchStartTime: new Date().toISOString(),
        }),
      });
    });
    
    // Navigate to the chosen page
    await page.goto('/chosen');
  });
  
  test('should allow navigation between tabs', async ({ page }) => {
    // Verify we're on the info tab by default
    await expect(page.getByTestId('chosen-info-view')).toBeVisible();
    
    // Click on the comments tab
    await page.getByText('comments').click();
    await expect(page.getByTestId('comment-view')).toBeVisible();
    
    // Click on the vote tab
    await page.getByText('vote').click();
    await expect(page.getByTestId('vote-comment')).toBeVisible();
    
    // Go back to info tab
    await page.getByText('info').click();
    await expect(page.getByTestId('chosen-info-view')).toBeVisible();
  });
  
  test('should show appropriate content in each tab', async ({ page }) => {
    // Test info tab content
    await expect(page.getByTestId('chosen-info-view')).toContainText('Test Event');
    
    // Test comments tab
    await page.getByText('comments').click();
    await expect(page.getByTestId('comment-view')).toBeVisible();
    // Test comment functionality here
    
    // Test vote tab
    await page.getByText('vote').click();
    await expect(page.getByTestId('vote-comment')).toBeVisible();
    // Test voting functionality here
  });
  
  // Test unauthenticated redirection
  test('should redirect to home when not authenticated', async ({ page }) => {
    // Override the auth mock to return null
    await page.route('**/api/auth/session', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(null),
      });
    });
    
    // Navigate to the chosen page and expect a redirect
    const response = await page.goto('/chosen');
    expect(response?.url()).toContain('/'); // Should be redirected to home
  });
});
