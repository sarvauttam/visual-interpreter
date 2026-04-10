const { Builder, By, until } = require('selenium-webdriver');

(async function explainOnlyTest() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://127.0.0.1:5500/index.html');

    const editor = await driver.findElement(By.css('textarea, [contenteditable="true"]'));
    await editor.sendKeys('if x >');

    const runButton = await driver.findElement(By.xpath("//button[contains(., 'Run')]"));
    await runButton.click();

    await driver.wait(until.elementLocated(By.tagName('body')), 5000);
    const text = await driver.findElement(By.tagName('body')).getText();

    if (!/explanation|line|code|hint/i.test(text)) {
      throw new Error('Explain-only response not detected');
    }

    console.log('Selenium explain-only test passed');
  } finally {
    await driver.quit();
  }
})();