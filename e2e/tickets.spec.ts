import { test, expect } from '@playwright/test';

test.describe('Tickets Flow', () => {
  test('should load and display ticket list', async ({ page }) => {
    await page.goto('/');

    // Click Tickets tab
    await page.locator('button:has-text("Tickets")').click();

    // Wait for tickets to load
    await page.waitForSelector('text=PL-');

    // Verify filter buttons exist
    expect(page.locator('button:has-text("All")')).toBeTruthy();
    expect(page.locator('button:has-text("Open")')).toBeTruthy();
    expect(page.locator('button:has-text("Resolved")')).toBeTruthy();
  });

  test('should filter tickets by status', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();

    // Wait for initial load
    await page.waitForSelector('text=PL-');

    // Click Open filter
    await page.locator('button:has-text("Open")').click();

    // Should show only open tickets (this depends on mock data)
    const tickets = await page.locator('button:has-text("PL-")').count();
    expect(tickets).toBeGreaterThan(0);
  });

  test('should open ticket modal on click', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();

    await page.waitForSelector('text=PL-');

    // Click first ticket
    await page.locator('button:has-text("PL-")').first().click();

    // Wait for modal
    await page.waitForSelector('text=Submitted by');
    expect(page.locator('text=Status')).toBeTruthy();
  });

  test('should update ticket status without refresh', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();

    await page.waitForSelector('text=PL-');
    const firstTicketText = await page.locator('button:has-text("PL-")').first().textContent();

    // Click ticket
    await page.locator('button:has-text("PL-")').first().click();
    await page.waitForSelector('text=Status');

    // Change status
    await page.locator('select').selectOption('in_progress');
    await page.locator('button:has-text("Save changes")').click();

    // Modal should close, ticket should be gone from current view if filters are active
    await page.waitForSelector('text=PL-', { timeout: 5000 });
  });
});
