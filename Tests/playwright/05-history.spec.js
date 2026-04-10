const { test, expect } = require('@playwright/test');

test('history stores previous code session', async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/index.html');

  const editor = page.locator('textarea, [contenteditable="true"]').first();
  await editor.fill('print("saved item")');

  await page.getByRole('button', { name: /run/i }).click();

  // Adjust this if your history button has different text
  await page.getByRole('button', { name: /history|save/i }).click();

  await expect(page.locator('body')).toContainText('saved item');
});