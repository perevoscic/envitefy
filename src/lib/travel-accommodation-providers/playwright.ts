import type { Browser, BrowserContext, Page } from "playwright";
import { markdownHotelLinks, parseHotelEvidence } from "../travel-accommodation-evidence";
import { extractHotelEvidenceWithAstra } from "./astra";
import type { TravelProviderOptions, TravelProviderResult } from "./budget";

export async function readHotelPage(page: Page): Promise<string> {
  return page.evaluate(() => {
    const root = (document.querySelector("main") || document.body).cloneNode(true) as HTMLElement;
    root.querySelectorAll("nav,header,footer,script,style,noscript").forEach((node) => {
      node.remove();
    });
    root.querySelectorAll("a[href]").forEach((node) => {
      const href = new URL(node.getAttribute("href") || "", document.baseURI).href;
      node.replaceWith(
        document.createTextNode(` [${node.textContent?.trim() || "Link"}](${href}) `),
      );
    });
    root.querySelectorAll("h1,h2,h3,h4,h5,h6,p,div,li,tr,br").forEach((node) => {
      if (/^H[1-6]$/.test(node.tagName))
        node.prepend(document.createTextNode(`${"#".repeat(Number(node.tagName[1]))} `));
      node.before(document.createTextNode("\n"));
      node.after(document.createTextNode("\n"));
    });
    return root.textContent || "";
  });
}

export async function extractHotelsWithPlaywright(
  url: string,
  options: TravelProviderOptions,
): Promise<TravelProviderResult> {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  const close = () => {
    void context?.close().catch(() => {});
    void browser?.close().catch(() => {});
  };
  options.signal.addEventListener("abort", close, { once: true });
  try {
    options.signal.throwIfAborted();
    const { chromium } = await import("playwright");
    browser = await chromium.launch({
      headless: true,
      timeout: Math.min(options.timeoutMs, 10000),
    });
    options.signal.throwIfAborted();
    context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: Math.min(options.timeoutMs, 12000),
    });
    // Expand local panels only. List links are followed by the bounded coordinator.
    const tabs = page
      .locator("button,[role='tab'],summary")
      .filter({ hasText: /host hotels?|hotel information|lodging|accommodation/i });
    for (let index = 0; index < Math.min(3, await tabs.count()); index++) {
      options.signal.throwIfAborted();
      await tabs
        .nth(index)
        .click({ timeout: 1000 })
        .catch(() => {});
    }
    const content = await readHotelPage(page);
    const sourceUrl = page.url();
    const links = markdownHotelLinks(content, sourceUrl);
    const hotelContext = { sourceUrl, links, sourceType: "web" as const };
    let hotels = parseHotelEvidence(content, hotelContext);
    if (!hotels.length)
      hotels = await extractHotelEvidenceWithAstra(content, hotelContext, options);
    return {
      hotels,
      content,
      links,
      fallbackLink: null,
      attempt: { provider: "playwright", ok: true, url: sourceUrl, error: null },
    };
  } finally {
    options.signal.removeEventListener("abort", close);
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
  }
}
