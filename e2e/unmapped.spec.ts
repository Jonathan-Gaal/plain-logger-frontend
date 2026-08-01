import { test, expect } from '@playwright/test';

/**
 * Drives the gap queue against a real seeded backend. Each test parses its
 * own unmapped payload first, since the seed data populates error_templates
 * and tickets but leaves parse_history empty — the queue is built from real
 * parse activity, so the test has to generate some.
 */
test.describe('Unmapped Queue', () => {
  type Page = import('@playwright/test').Page;

  /**
   * The top-level tabs, scoped to the nav — "Unmapped" is also the name of a
   * filter button inside the Tickets panel, so an unscoped lookup is
   * ambiguous.
   */
  function tab(page: Page, name: string) {
    return page.locator('nav').getByRole('button', { name, exact: true });
  }

  async function parse(page: Page, payload: string) {
    await tab(page, 'Parse Log').click();
    await page.locator('textarea').fill(payload);
    await page.locator('button:has-text("Parse Log")').nth(1).click();
    await page.waitForSelector('text=Code not recognized');
  }

  test('groups repeat misses of one code into a single row with a hit count', async ({
    page,
  }) => {
    await page.goto('/');

    const code = `e2e.queue.${Date.now()}`;
    await parse(page, JSON.stringify({ error_code: code }));
    await parse(page, JSON.stringify({ error_code: code }));

    await tab(page, 'Unmapped Codes').click();

    const row = page.getByTestId('unmapped-queue').locator('li', { hasText: code });
    await expect(row).toBeVisible();
    await expect(row).toContainText('2 hits');
  });

  test('offers the closest known code as a lead', async ({ page }) => {
    await page.goto('/');

    // A typo of the seeded `node.temperature`.
    await parse(page, JSON.stringify({ error_code: 'node.temperatur' }));

    await tab(page, 'Unmapped Codes').click();

    const row = page
      .getByTestId('unmapped-queue')
      .locator('li', { hasText: 'node.temperatur' })
      .first();
    await expect(row).toContainText('Closest known code:');
    await expect(row).toContainText('node.temperature');
    await expect(row).toContainText('% match');
  });

  test('summarizes the outstanding gap', async ({ page }) => {
    await page.goto('/');
    await parse(page, JSON.stringify({ error_code: `e2e.summary.${Date.now()}` }));

    await tab(page, 'Unmapped Codes').click();

    await expect(page.getByTestId('unmapped-summary')).toContainText(
      'with no template'
    );
  });

  test('never lists a code that already has a template', async ({ page }) => {
    await page.goto('/');

    // node.temperature is seeded, so this matches rather than missing.
    await page.locator('textarea').fill('{"error_code": "node.temperature"}');
    await page.locator('button:has-text("Parse Log")').nth(1).click();
    await page.waitForSelector('text=Specialist Diagnostic');

    await tab(page, 'Unmapped Codes').click();
    // Either the queue rendered or the panel says there's nothing in it.
    await expect(
      page
        .getByTestId('unmapped-queue')
        .or(page.getByText('No unmapped codes.'))
    ).toBeVisible();

    const exactRows = page
      .getByTestId('unmapped-queue')
      .locator('li')
      .filter({ hasText: /^node\.temperature\b/ });
    await expect(exactRows).toHaveCount(0);
  });
});
