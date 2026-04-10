const { Builder, By } = require('selenium-webdriver');

(async function pageLoadTest() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://127.0.0.1:5500/index.html');

    const bodyText = await driver.findElement(By.tagName('body')).getText();

    if (!bodyText.includes('Code') || !bodyText.includes('Explanations') || !bodyText.includes('Output')) {
      throw new Error('Main interface sections were not found');
    }

    console.log('Selenium page load test passed');
  } finally {
    await driver.quit();
  }
})();