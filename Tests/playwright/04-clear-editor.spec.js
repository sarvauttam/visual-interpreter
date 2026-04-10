const { test, expect } = require('@playwright/test');

test('clear button resets editor content', async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/index.html');

  const editor = page.locator('textarea, [contenteditable="true"]').first();
  await editor.fill('print("test")');

  await page.getByRole('button', { name: /clear/i }).click();

  const tagName = await editor.evaluate(el => el.tagName.toLowerCase());

  if (tagName === 'textarea') {
    await expect(editor).toHaveValue('');
  } else {
    await expect(editor).toHaveText('');
  }
});