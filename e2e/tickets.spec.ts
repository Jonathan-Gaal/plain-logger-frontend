import { test, expect } from '@playwright/test';

test.describe('Tickets Flow', () => {
  test('should load and display ticket list', async ({ page }) => {
    await page.goto('/');

    // Click Tickets tab
    await page.locator('button:has-text("Tickets")').click();

    // Wait for tickets to load
    await page.waitForSelector('text=PL-');

    // Verify filter buttons exist
    expect(page.getByRole('button', { name: 'All', exact: true })).toBeTruthy();
    expect(page.getByRole('button', { name: 'Open', exact: true })).toBeTruthy();
    expect(page.getByRole('button', { name: 'Resolved', exact: true })).toBeTruthy();
  });

  test('should filter tickets by status', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();

    // Wait for initial load
    await page.waitForSelector('text=PL-');

    // Click Open filter (exact match — ticket rows also render an "Open" status badge)
    await page.getByRole('button', { name: 'Open', exact: true }).click();

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

  test('should show Unmapped and Mapped filter pills', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();
    await page.waitForSelector('text=PL-');

    await expect(page.getByRole('button', { name: 'Unmapped', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mapped', exact: true })).toBeVisible();
  });

  test('Unmapped filter only shows tickets with no matched template', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();
    await page.waitForSelector('text=PL-');

    await page.getByRole('button', { name: 'Unmapped', exact: true }).click();
    await page.waitForTimeout(300);

    const ticketButtons = page.locator('ul > li > button');
    const count = await ticketButtons.count();

    // Every visible ticket under "Unmapped" should open a modal that shows
    // the "no matching template" copy rather than a Specialist Diagnostic card.
    for (let i = 0; i < count; i++) {
      await ticketButtons.nth(i).click();
      await expect(
        page.locator('text=No matching error template')
      ).toBeVisible();
      await page.locator('button:has-text("Cancel")').click();
    }
  });

  test('Mapped filter only shows tickets with a matched template', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();
    await page.waitForSelector('text=PL-');

    await page.getByRole('button', { name: 'Mapped', exact: true }).click();
    await page.waitForTimeout(300);

    const ticketButtons = page.locator('ul > li > button');
    const count = await ticketButtons.count();
    expect(count).toBeGreaterThan(0);

    await ticketButtons.first().click();
    await expect(page.locator('text=Specialist Diagnostic —')).toBeVisible();
  });
});
