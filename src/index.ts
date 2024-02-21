const puppeteer = require('puppeteer');
const fs = require('fs');
const { searchText } = require('../search.json')

const BROWSER_LAUNCH_MODE = process.env.BROWSER_LAUNCH_MODE === 'PRODUCTION' ? 'PRODUCTION' : 'DEVELOPMENT';
const browser_launch_options = BROWSER_LAUNCH_MODE === 'PRODUCTION'
  ? { executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox', '--disable-gpu'] }
  : { headless: false };

(async () => {
  try {
    const browser = await puppeteer.launch(browser_launch_options);
    const page = await browser.newPage();
    await page.goto('https://shopping.google.com/');
    await page.type("input[placeholder='What are you looking for?']", searchText);
    await page.click("button[aria-label='Google Search']");
    await page.waitForSelector('#pnnext');

    // Go to next results page
    await page.click('#pnnext');
    await page.waitForSelector('#pnnext');

    // Gather product title
    const title = await page.$$eval('div.sh-dgr__grid-result h3', (nodes) => {
      return nodes.map((n) => n.innerText);
    });

    console.log(title)
    // Gather price
    const price = await page.$$eval(
      'div.sh-dgr__grid-result a.shntl div span span[aria-hidden="true"] span:nth-child(1)',
      (nodes) => nodes.map((n) => n.innerText)
    );

    // Consolidate product search data
    const googleShoppingSearchArray = title.slice(0, 10).map((_, index) => {
      return {
        title: title[index],
        price: price[index],
      };
    });

    const jsonData = JSON.stringify(googleShoppingSearchArray, null, 2);
    fs.writeFileSync('googleShoppingSearchResults.json', jsonData);
    // await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
