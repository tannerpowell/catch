import { chromium } from "playwright";

async function screenshotMenuDisplay() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  console.log("Navigating to menu display...");

  try {
    await page.goto("http://localhost:3000/menu-display/conroe", {
      waitUntil: "networkidle",
      timeout: 30000
    });

    // Wait for fonts to load
    await page.waitForTimeout(2000);

    console.log("Taking screenshot...");
    await page.screenshot({
      path: "test-results/menu-display-new.png",
      fullPage: false
    });

    console.log("✓ Screenshot saved to test-results/menu-display-new.png");
  } catch (error) {
    console.error("Error:", error);
  }

  await browser.close();
}

screenshotMenuDisplay();
