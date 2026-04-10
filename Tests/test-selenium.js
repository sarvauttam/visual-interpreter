const { Builder, By, until } = require('selenium-webdriver');

(async function testInterpreter() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://localhost:5500');


    let editor = await driver.findElement(By.css('textarea'));
    await editor.sendKeys('print(10)');

    let runButton = await driver.findElement(By.xpath("//*[text()='Run']"));
    await runButton.click();

    let output = await driver.wait(
      until.elementLocated(By.id('output')),
      5000
    );

    let text = await output.getText();
    console.log('Output:', text);

  } finally {
    await driver.quit();
  }
})();