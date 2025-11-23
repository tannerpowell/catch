// scripts/scrape-images.ts
// Requires: npm i -D playwright @types/node ts-node
// Run: npx playwright install && npx ts-node scripts/scrape-images.ts > scraped-images.json
import { chromium } from "playwright";

function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

(async () => {
  let browser;
  let context;
  let page;

  try {
    browser = await chromium.launch({ args: ["--disable-blink-features=AutomationControlled"] });
    context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1440, height: 900 }
    });
    page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });
    
    // Change this to a specific location menu if needed:
    const url = process.env.CATCH_MENU_URL || "https://thecatchhouston.com/menu";
    
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    } catch (navError) {
      console.error(`Failed to navigate to ${url}: ${navError instanceof Error ? navError.message : String(navError)}`);
      throw navError;
    }

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(4000);

    // Scroll to force lazy images to load
    for (let i=0;i<15;i++){ await page.mouse.wheel(0, 1200); await sleep(250); }
    await page.waitForTimeout(2000);

    // Extract potential cards: look for images + nearby text
    const results = await page.evaluate(() => {
      // Owner.com often renders <img> or <picture> inside product cards
      const data: any[] = [];
      document.querySelectorAll("img").forEach((img) => {
        const src = (img as HTMLImageElement).src;
        const alt = (img as HTMLImageElement).alt || "";
        // Walk up to find a title/price nearby
        let el: HTMLElement | null = img.closest("article,div,li,section") as HTMLElement | null;
        let text = "";
        if (el) text = el.innerText;
        data.push({ src, alt, text });
      });
      return data;
    });

    // Heuristic: try to map image blobs to item names found on page
    // Build item names list (from visible text)
    const visibleText = await page.evaluate(() => document.body.innerText);
    const names = Array.from(new Set(visibleText.split(/\n|\r/).map(s=>s.trim()).filter(Boolean)));

    // Save a simple blob (you will map manually or with a small script)
    const out = { url, scrapedAt: new Date().toISOString(), images: results };
    console.log(JSON.stringify(out, null, 2));
  } catch (error) {
    console.error('Scraping error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Ensure resources are cleaned up
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
})();
