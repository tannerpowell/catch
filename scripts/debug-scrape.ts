import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://thecatchhouston.com/menu', { waitUntil: 'networkidle' });
  
  // Wait for main content to be visible (assuming menu items are in a container)
  // Adjust the selector based on actual page structure
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => document.body.innerText.length > 100, { timeout: 10000 });
  
  const bodyLength = await page.evaluate(() => document.body.innerText.length);
  console.log('body length', bodyLength);
  const html = await page.content();
  console.log(html.slice(0, 500));
  await browser.close();
})();
