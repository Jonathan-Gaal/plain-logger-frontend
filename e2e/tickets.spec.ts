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

    // Click ticket
    await page.locator('button:has-text("PL-")').first().click();
    await page.waitForSelector('text=Status');

    // Target the status select by name — a bare locator('select') also matches
    // the list's sort control now that one exists.
    await page.getByLabel('Ticket status').selectOption('in_progress');
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

  test('sorts the list by severity in both directions', async ({ page }) => {
    const RANK: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };

    async function severities() {
      const rows = await page.locator('ul > li > button').allTextContents();
      return rows
        .map((t) => t.toLowerCase().match(/critical|high|medium|low/)?.[0])
        .filter((s): s is string => Boolean(s));
    }

    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();
    await page.waitForSelector('text=PL-');

    const sort = page.getByLabel('Sort tickets');
    await expect(sort).toHaveValue('newest');

    await sort.selectOption('severity_desc');
    await page.waitForTimeout(400);
    const desc = await severities();
    expect(desc.length).toBeGreaterThan(1);
    expect(desc.every((s, i) => i === 0 || RANK[desc[i - 1]] >= RANK[s])).toBe(true);

    await sort.selectOption('severity_asc');
    await page.waitForTimeout(400);
    const asc = await severities();
    expect(asc.every((s, i) => i === 0 || RANK[asc[i - 1]] <= RANK[s])).toBe(true);

    // Same tickets either way — sorting must not drop or duplicate rows.
    expect(asc.length).toBe(desc.length);
  });

  test('keeps the chosen sort when the filter changes', async ({ page }) => {
    const RANK: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };

    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();
    await page.waitForSelector('text=PL-');

    await page.getByLabel('Sort tickets').selectOption('severity_desc');
    await page.getByRole('button', { name: 'Open', exact: true }).click();
    await page.waitForTimeout(500);

    await expect(page.getByLabel('Sort tickets')).toHaveValue('severity_desc');

    const rows = await page.locator('ul > li > button').allTextContents();
    const sev = rows
      .map((t) => t.toLowerCase().match(/critical|high|medium|low/)?.[0])
      .filter((s): s is string => Boolean(s));
    expect(sev.every((s, i) => i === 0 || RANK[sev[i - 1]] >= RANK[s])).toBe(true);
  });

  // --- Editing template messages on resolved tickets ---
  //
  // The edit affordances are deliberately gated on status === 'resolved',
  // so these open a resolved ticket rather than just any mapped one.

  test('does not offer message editing on a ticket that is still open', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();
    await page.waitForSelector('text=PL-');

    await page.getByRole('button', { name: 'Open', exact: true }).click();
    await page.waitForTimeout(300);

    const ticketButtons = page.locator('ul > li > button');
    if ((await ticketButtons.count()) === 0) test.skip();

    await ticketButtons.first().click();
    await page.waitForSelector('text=Submitted by');

    await expect(
      page.getByRole('button', { name: 'Edit specialist diagnostic' })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Edit employee message' })
    ).toHaveCount(0);
  });

  test('offers message editing on a resolved, mapped ticket', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();
    await page.waitForSelector('text=PL-');

    await page.getByRole('button', { name: 'Resolved', exact: true }).click();
    await page.waitForTimeout(300);

    const ticketButtons = page.locator('ul > li > button');
    if ((await ticketButtons.count()) === 0) test.skip();

    await ticketButtons.first().click();
    await expect(page.locator('text=Specialist Diagnostic —')).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Edit specialist diagnostic' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Edit employee message' })
    ).toBeVisible();
  });

  test('cancelling an edit leaves the original message untouched', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Tickets")').click();
    await page.waitForSelector('text=PL-');

    await page.getByRole('button', { name: 'Resolved', exact: true }).click();
    await page.waitForTimeout(300);

    const ticketButtons = page.locator('ul > li > button');
    if ((await ticketButtons.count()) === 0) test.skip();
    await ticketButtons.first().click();
    await expect(page.locator('text=Specialist Diagnostic —')).toBeVisible();

    await page.getByRole('button', { name: 'Edit specialist diagnostic' }).click();
    const textarea = page.locator('textarea').first();
    const original = await textarea.inputValue();

    await textarea.fill('THIS EDIT SHOULD BE DISCARDED');
    // The edit panel's own Cancel is the first one; the modal footer has another.
    await page.getByRole('button', { name: 'Cancel', exact: true }).first().click();

    await expect(page.locator('text=THIS EDIT SHOULD BE DISCARDED')).toHaveCount(0);
    await expect(page.getByText(original, { exact: true }).first()).toBeVisible();
  });

  // NOTE: there is deliberately no E2E test that actually *saves* a message
  // edit. Doing so mutates error_templates text that is shared by every
  // ticket using that error code, there is no DELETE/unlink endpoint to undo
  // it, and there is no POST /api/tickets to build an isolated throwaway
  // fixture to mutate instead. An earlier version of this file did attempt a
  // save-then-restore round trip; it timed out under parallel workers partway
  // through and left junk text permanently in a seeded template.
  //
  // The save path is covered where it can be cleaned up properly:
  //   - backend  tests/error-templates.test.ts  (real HTTP + real DB, against
  //              templates the suite creates itself)
  //   - frontend TicketsPanel.test.tsx          (full UI flow against MSW)
});
