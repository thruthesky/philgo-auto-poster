const puppeteer = require('puppeteer');


(async () => {
  const browser = await puppeteer.launch( { headless: false } );
  const page = await browser.newPage();
  // await page.goto('https://www.philgo.com/');
  // await page.screenshot({path: 'screenshots/philgo.png'});

  await page.goto('http://www.tistory.com/');
  await page.click('.link_login');
  await page.waitFor('#loginId').then(a => {}).catch(e => {});



  // don't end the browser.
  // await browser.close();
})();
