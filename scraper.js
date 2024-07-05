const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;

const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://www.linkedin.com');
  await browser.close();
})();
