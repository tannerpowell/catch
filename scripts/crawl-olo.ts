/**
 * Crawl OLO menu pages for Tyler and Longview
 * Usage: npx playwright test scripts/crawl-olo.ts
 */

import { chromium } from 'playwright';

interface MenuItem {
  name: string;
  price: string | null;
  description: string | null;
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

async function scrapeOLO(location: string): Promise<MenuCategory[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`\n=== Scraping OLO: ${location} ===\n`);

  try {
    await page.goto(`https://thecatchtx.olo.com/menu/the-catch-${location}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for menu to load
    await page.waitForTimeout(5000);

    // Get HTML for debugging
    const html = await page.content();

    // Try to find menu items by looking at the page structure
    const menuData = await page.evaluate(() => {
      const results: MenuCategory[] = [];

      // OLO uses specific class patterns - let's find them
      const allText = document.body.innerText;

      // Look for category headers and items
      const sections = document.querySelectorAll('section, [class*="category"], [class*="menu-section"]');

      sections.forEach(section => {
        const header = section.querySelector('h2, h3, [class*="header"], [class*="title"]');
        const categoryName = header?.textContent?.trim();

        if (!categoryName || categoryName.length > 50) return;

        const items: MenuItem[] = [];
        const cards = section.querySelectorAll('[class*="product"], [class*="item"], article, [class*="card"]');

        cards.forEach(card => {
          const nameEl = card.querySelector('h3, h4, [class*="name"], [class*="title"]');
          const priceEl = card.querySelector('[class*="price"]');
          const descEl = card.querySelector('p, [class*="desc"]');

          const name = nameEl?.textContent?.trim();
          if (name && name.length < 100) {
            items.push({
              name,
              price: priceEl?.textContent?.trim() || null,
              description: descEl?.textContent?.trim() || null
            });
          }
        });

        if (items.length > 0) {
          results.push({ category: categoryName, items });
        }
      });

      return results;
    });

    if (menuData.length === 0) {
      // Fallback: dump all visible text that looks like menu items
      console.log('No structured data found, dumping page text...');
      const text = await page.evaluate(() => document.body.innerText);
      console.log(text.substring(0, 5000));
    } else {
      console.log(JSON.stringify(menuData, null, 2));
    }

    await browser.close();
    return menuData;

  } catch (error) {
    console.error(`Error scraping ${location}:`, error);
    await browser.close();
    return [];
  }
}

async function main() {
  const tylerMenu = await scrapeOLO('tyler');
  const longviewMenu = await scrapeOLO('longview');

  // Save results
  const results = {
    tyler: tylerMenu,
    longview: longviewMenu,
    scrapedAt: new Date().toISOString()
  };

  console.log('\n=== FINAL RESULTS ===\n');
  console.log(`Tyler: ${tylerMenu.length} categories`);
  console.log(`Longview: ${longviewMenu.length} categories`);
}

main().catch(console.error);
