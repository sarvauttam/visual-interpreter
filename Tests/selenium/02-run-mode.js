const { Builder, By, until } = require('selenium-webdriver');

(async function runModeTest() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://127.0.0.1:5500/index.html');

    const editor = await driver.findElement(By.css('textarea, [contenteditable="true"]'));
    await editor.sendKeys('print("selenium")');

    const runButton = await driver.findElement(By.xpath("//button[contains(., 'Run')]"));
    await runButton.click();

    await driver.wait(async () => {
      const body = await driver.findElement(By.tagName('body')).getText();
      return body.includes('selenium');
    }, 5000);

    console.log('Selenium run mode test passed');
  } finally {
    await driver.quit();
  }
})();