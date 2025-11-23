import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ args: ["--disable-blink-features=AutomationControlled"] });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const url = process.env.REVEL_URL || "https://conroe.revelup.online/store/105/category/1045/subcategory/1047";

  const details: Array<{
    url: string;
    op?: string;
    headers: Record<string, string>;
    body: any;
    response: any;
  }> = [];

  page.on("response", async response => {
    try {
      if (!response.url().includes("/graphql")) return;
      const req = response.request();
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers())) {
        headers[key.toLowerCase()] = value;
      }
      const reqBody = req.postDataJSON ? req.postDataJSON() : req.postData();
      const resBody = await response.json();
      details.push({
        url: response.url(),
        op: reqBody?.operationName,
        headers,
        body: reqBody,
        response: resBody
      });
    } catch (err) {}
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(7000);

  const importantOps = new Set(["fetchCategoryList", "productList"]);
  details
    .filter(call => call.op && importantOps.has(call.op))
    .forEach(call => {
      console.log("===", call.op, "===");
      console.log("Request:", JSON.stringify(call.body, null, 2));
      console.log("Response sample:", JSON.stringify(call.response, null, 2).slice(0, 2000));
    });

  await browser.close();
})();
