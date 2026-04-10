const { test, expect } = require('@playwright/test');

test('main interface loads correctly', async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/index.html');

  await expect(page.locator('body')).toContainText('Code');
  await expect(page.locator('body')).toContainText('Explanations');
  await expect(page.locator('body')).toContainText('Output');

  await expect(page.getByRole('button', { name: /run/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /clear/i })).toBeVisible();
});