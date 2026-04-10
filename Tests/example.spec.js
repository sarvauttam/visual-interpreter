const { test, expect } = require('@playwright/test');

test('Interpreter Run Mode test', async ({ page }) => {
  await page.goto('http://localhost:5500');

  // Type code into your editor (adjust selector!)
  await page.fill('textarea', 'print(5)');

  // Click Run button (adjust text if needed)
  await page.click('text=Run');

  // Check output appears
  await expect(page.locator('#output')).toContainText('5');
});