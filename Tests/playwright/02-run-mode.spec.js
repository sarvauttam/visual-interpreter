const { test, expect } = require('@playwright/test');

test('run mode executes simple code and updates output', async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/index.html');

  const editor = page.locator('textarea, [contenteditable="true"]').first();
  await editor.fill('print("Hello")');

  await page.getByRole('button', { name: /run/i }).click();

  await expect(page.locator('body')).toContainText('Hello');
});