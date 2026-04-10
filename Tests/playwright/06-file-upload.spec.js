const { test, expect } = require('@playwright/test');
const path = require('path');

test('debug file upload', async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/index.html');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(__dirname, '../../tests-fixtures/sample.py'));

  await page.waitForTimeout(2000);

  console.log(await page.locator('body').innerText());
});