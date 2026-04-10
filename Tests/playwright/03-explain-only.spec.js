const { test, expect } = require('@playwright/test');

test('explain-only mode handles incomplete code', async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/index.html');

  const editor = page.locator('textarea, [contenteditable="true"]').first();
  await editor.fill('for i in range(5):');

  await page.getByRole('button', { name: /run/i }).click();

  await expect(page.locator('body')).toContainText(/loop|range|line|explanation|code/i);
});