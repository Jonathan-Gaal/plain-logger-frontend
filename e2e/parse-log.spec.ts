import { test, expect } from '@playwright/test';

test.describe('Parse Log Flow', () => {
  test('should parse valid JSON and display results', async ({ page }) => {
    await page.goto('/');

    // Find textarea and enter valid JSON. Uses a real seeded BGL error code
    // (node.temperature) so the backend returns a "matched" result.
    const textarea = page.locator('textarea');
    await textarea.fill('{"error_code": "node.temperature", "node": "node-104", "message": "ambient=28"}');

    // Check character counter updated
    expect(page.locator('text=/\\d+ \\/ 20,000 characters/')).toBeTruthy();

    // Click Parse button
    const parseButton = page.locator('button:has-text("Parse Log")').nth(1); // Second one (in panel, not nav)
    await parseButton.click();

    // Wait for results to appear
    await page.waitForSelector('text=Specialist Diagnostic');

    // Verify both cards rendered
    expect(page.locator('text=Specialist Diagnostic')).toBeTruthy();
    expect(page.locator('text=Employee-Facing Message')).toBeTruthy();
  });

  test('should show error on invalid JSON', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea');
    await textarea.fill('{"error_code": "node.temperature",'); // Invalid JSON

    const parseButton = page.locator('button:has-text("Parse Log")').nth(1);
    await parseButton.click();

    // Wait for error message
    await page.waitForSelector('text=Payload is not valid JSON');
    expect(page.locator('text=Payload is not valid JSON')).toBeTruthy();
  });

  test('should disable Parse button when textarea is empty', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea');
    const parseButton = page.locator('button:has-text("Parse Log")').nth(1);

    // Initially disabled
    expect(await parseButton.isDisabled()).toBe(true);

    // Enable after typing
    await textarea.fill('{"error_code": "TEST"}');
    expect(await parseButton.isDisabled()).toBe(false);
  });

  test('should match a code buried in a wrapped payload and name its path', async ({ page }) => {
    await page.goto('/');

    // A Winston-style envelope: the seeded code is two levels down, which
    // only resolves because extraction walks nested objects.
    const textarea = page.locator('textarea');
    await textarea.fill(
      '{"level": "error", "logger": "fulfillment-api", "meta": {"error": {"error_code": "node.temperature"}}}'
    );

    const parseButton = page.locator('button:has-text("Parse Log")').nth(1);
    await parseButton.click();

    await page.waitForSelector('text=Specialist Diagnostic');

    const note = page.getByTestId('code-path-note');
    await expect(note).toContainText('meta.error.error_code');
    await expect(note).toContainText('nested inside the pasted payload');
  });

  test('should show unmapped result', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea');
    await textarea.fill('{"code": "XYZ_UNKNOWN_CODE", "message": "test"}');

    const parseButton = page.locator('button:has-text("Parse Log")').nth(1);
    await parseButton.click();

    await page.waitForSelector('text=Code not recognized');
    expect(page.locator('text=Code not recognized')).toBeTruthy();
  });

  test('should suggest the real code when an unmapped one is a near miss', async ({ page }) => {
    await page.goto('/');

    // A typo of the seeded `node.temperature`.
    const textarea = page.locator('textarea');
    await textarea.fill('{"error_code": "node.temperatur", "node": "node-104"}');

    const parseButton = page.locator('button:has-text("Parse Log")').nth(1);
    await parseButton.click();

    await page.waitForSelector('text=Code not recognized');

    const list = page.getByTestId('suggestion-list');
    await expect(list).toBeVisible();
    await expect(list.getByText('node.temperature')).toBeVisible();
    await expect(list.locator('li').first()).toContainText('% match');
  });

  test('should offer no suggestions for a genuinely novel code', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea');
    await textarea.fill('{"error_code": "zzzzqqqq.wwwwvvvv.yyyy"}');

    const parseButton = page.locator('button:has-text("Parse Log")').nth(1);
    await parseButton.click();

    await page.waitForSelector('text=Code not recognized');
    await expect(page.getByTestId('suggestion-list')).toHaveCount(0);
  });
});
