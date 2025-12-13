import { chromium } from 'playwright';

async function extractOrderLinks() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Extracting ORDER ONLINE links from thecatchseafood.com/locations...\n');
  
  await page.goto('https://thecatchseafood.com/locations', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Extract all links with their context
  const data = await page.evaluate(() => {
    const results: {location: string, orderUrl: string}[] = [];
    
    // Find all location cards/sections
    const allLinks = Array.from(document.querySelectorAll('a'));
    
    allLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent?.trim().toLowerCase() || '';
      
      // Look for order-related links
      if (text.includes('order') || href.includes('order') || href.includes('olo') || href.includes('revel') || href.includes('skytab')) {
        // Try to find location context
        const parent = link.closest('div') || link.parentElement;
        const locationText = parent?.textContent?.substring(0, 100) || 'Unknown';
        results.push({
          location: locationText.replace(/order online/gi, '').trim().substring(0, 50),
          orderUrl: href
        });
      }
    });
    
    return results;
  });
  
  console.log('Found links:');
  data.forEach(item => {
    console.log(`${item.location}`);
    console.log(`  -> ${item.orderUrl}\n`);
  });
  
  await browser.close();
}

extractOrderLinks().catch(console.error);
