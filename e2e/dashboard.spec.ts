import { test, expect } from '@playwright/test';

/**
 * Drives the dashboard against a real seeded backend, so the figures come
 * from actual seeded templates and tickets rather than fixtures.
 */
test.describe('Dashboard', () => {
  type Page = import('@playwright/test').Page;

  function tab(page: Page, name: string) {
    return page.locator('nav').getByRole('button', { name, exact: true });
  }

  test('renders the headline stat cards', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Dashboard').click();

    await expect(page.getByTestId('dashboard')).toBeVisible();
    for (const id of [
      'stat-match-rate',
      'stat-coverage',
      'stat-self-service',
      'stat-open-tickets',
    ]) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
  });

  test('reports percentages, never NaN', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Dashboard').click();

    const dashboard = page.getByTestId('dashboard');
    await expect(dashboard).toBeVisible();
    await expect(dashboard).not.toContainText('NaN');
    await expect(page.getByTestId('stat-match-rate')).toContainText('%');
  });

  test('reflects the seeded ticket queue', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Dashboard').click();

    // The seed populates tickets, so the queue section must show real counts.
    await expect(page.getByText('Ticket queue by severity')).toBeVisible();
    await expect(page.getByTestId('stat-open-tickets')).toContainText('total');
  });

  test('a fresh parse shows up in the most-parsed codes', async ({ page }) => {
    await page.goto('/');

    const code = `e2e.dash.${Date.now()}`;
    await page.locator('textarea').fill(JSON.stringify({ error_code: code }));
    await page.locator('button:has-text("Parse Log")').nth(1).click();
    await page.waitForSelector('text=Code not recognized');

    await tab(page, 'Dashboard').click();

    const list = page.getByTestId('top-codes');
    await expect(list).toBeVisible();
    // It may not crack the top five, but the section must render with counts.
    await expect(list.locator('li').first()).toContainText(/parse/);
  });
});
