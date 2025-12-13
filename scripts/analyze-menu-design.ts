import { chromium } from "playwright";

async function analyzeMenuDesign() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navigating to Russ & Daughters...");
  await page.goto("https://shop.russanddaughters.com/", {
    waitUntil: "networkidle",
    timeout: 30000
  });

  // Wait for menu section to be visible
  await page.waitForSelector("#menu-section", { timeout: 10000 }).catch(() => {
    console.log("No #menu-section found, looking for menu content...");
  });

  // Take a screenshot of the menu section
  console.log("\nTaking screenshots...");
  await page.screenshot({ path: "test-results/russ-full-page.png", fullPage: true });

  // Try to scroll to and capture the menu section
  const menuSection = await page.$("#menu-section");
  if (menuSection) {
    await menuSection.screenshot({ path: "test-results/russ-menu-section.png" });
  }

  // Extract the menu section HTML structure
  console.log("\n=== MENU SECTION HTML STRUCTURE ===\n");
  const menuHtml = await page.evaluate(() => {
    const section = document.querySelector("#menu-section") ||
      document.querySelector('[class*="menu"]') ||
      document.querySelector('[id*="menu"]');
    if (section) {
      return section.outerHTML.substring(0, 10000); // First 10k chars
    }
    return "Menu section not found";
  });
  console.log(menuHtml);

  // Extract computed styles for key elements
  console.log("\n=== TYPOGRAPHY & STYLES ===\n");
  const styles = await page.evaluate(() => {
    const results: Record<string, unknown> = {};

    // Get body/page fonts
    const body = document.body;
    const bodyStyles = getComputedStyle(body);
    results.bodyFont = {
      fontFamily: bodyStyles.fontFamily,
      fontSize: bodyStyles.fontSize,
      color: bodyStyles.color,
      backgroundColor: bodyStyles.backgroundColor
    };

    // Find headings in menu area
    const menuArea = document.querySelector("#menu-section") ||
      document.querySelector('[class*="menu"]') ||
      document.body;

    // Get all unique font-families used
    const allElements = menuArea.querySelectorAll("*");
    const fonts = new Set<string>();
    const fontSizes = new Set<string>();

    allElements.forEach((el) => {
      const style = getComputedStyle(el);
      fonts.add(style.fontFamily);
      if (style.fontSize) fontSizes.add(style.fontSize);
    });

    results.fontsUsed = Array.from(fonts).slice(0, 10);
    results.fontSizesUsed = Array.from(fontSizes).sort();

    // Look for menu item patterns
    const menuItems = menuArea.querySelectorAll('[class*="item"], [class*="product"], [class*="menu"] > div');
    if (menuItems.length > 0) {
      const firstItem = menuItems[0];
      const itemStyles = getComputedStyle(firstItem);
      results.menuItemStyles = {
        display: itemStyles.display,
        padding: itemStyles.padding,
        margin: itemStyles.margin,
        borderBottom: itemStyles.borderBottom
      };
    }

    // Look for price elements
    const priceElements = menuArea.querySelectorAll('[class*="price"], [class*="cost"]');
    if (priceElements.length > 0) {
      const priceStyle = getComputedStyle(priceElements[0]);
      results.priceStyles = {
        fontFamily: priceStyle.fontFamily,
        fontSize: priceStyle.fontSize,
        fontWeight: priceStyle.fontWeight,
        color: priceStyle.color
      };
    }

    // Get section headings
    const headings = menuArea.querySelectorAll("h1, h2, h3, h4, h5, h6");
    if (headings.length > 0) {
      results.headingStyles = Array.from(headings).slice(0, 5).map((h) => {
        const s = getComputedStyle(h);
        return {
          tag: h.tagName,
          text: h.textContent?.trim().substring(0, 50),
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          letterSpacing: s.letterSpacing,
          textTransform: s.textTransform,
          color: s.color
        };
      });
    }

    return results;
  });

  console.log(JSON.stringify(styles, null, 2));

  // Extract the actual menu items structure
  console.log("\n=== MENU ITEMS STRUCTURE ===\n");
  const menuItems = await page.evaluate(() => {
    const items: Array<{
      name: string;
      price: string;
      description: string;
      category: string;
    }> = [];

    // Look for any structured menu content
    const allText = document.body.innerText;
    const menuMatch = allText.match(/menu/gi);
    console.log("Menu mentions found:", menuMatch?.length || 0);

    // Try to find product/menu patterns
    const productCards = document.querySelectorAll(
      '[class*="product"], [class*="item"], [class*="menu-item"]'
    );

    productCards.forEach((card) => {
      const name = card.querySelector('[class*="name"], [class*="title"], h3, h4')?.textContent?.trim();
      const price = card.querySelector('[class*="price"]')?.textContent?.trim();
      const desc = card.querySelector('[class*="desc"], p')?.textContent?.trim();

      if (name) {
        items.push({
          name: name.substring(0, 100),
          price: price || "",
          description: desc?.substring(0, 200) || "",
          category: ""
        });
      }
    });

    return items.slice(0, 20);
  });

  console.log(JSON.stringify(menuItems, null, 2));

  // Get all CSS custom properties (CSS variables)
  console.log("\n=== CSS VARIABLES ===\n");
  const cssVars = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    const vars: Record<string, string> = {};

    // Common CSS variable patterns
    const varNames = [
      "--color-primary",
      "--color-secondary",
      "--color-accent",
      "--color-text",
      "--color-background",
      "--font-primary",
      "--font-secondary",
      "--font-heading",
      "--font-body"
    ];

    varNames.forEach((name) => {
      const value = styles.getPropertyValue(name);
      if (value) vars[name] = value.trim();
    });

    return vars;
  });

  console.log(JSON.stringify(cssVars, null, 2));

  // Get background colors and any patterns
  console.log("\n=== BACKGROUND & COLORS ===\n");
  const colors = await page.evaluate(() => {
    const menuSection = document.querySelector("#menu-section") || document.body;
    const style = getComputedStyle(menuSection);

    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      color: style.color,
      borderColor: style.borderColor
    };
  });

  console.log(JSON.stringify(colors, null, 2));

  // Extract all class names used in menu section
  console.log("\n=== CLASS NAMES IN MENU AREA ===\n");
  const classNames = await page.evaluate(() => {
    const menuSection = document.querySelector("#menu-section") ||
      document.querySelector('[id*="menu"]') ||
      document.body;
    const classes = new Set<string>();
    menuSection.querySelectorAll("*").forEach((el) => {
      el.classList.forEach((c) => classes.add(c));
    });
    return Array.from(classes).filter(c =>
      c.includes("menu") || c.includes("item") || c.includes("price") ||
      c.includes("product") || c.includes("category") || c.includes("section")
    ).slice(0, 30);
  });

  console.log(classNames);

  await browser.close();
  console.log("\n✓ Screenshots saved to test-results/");
}

analyzeMenuDesign().catch(console.error);
