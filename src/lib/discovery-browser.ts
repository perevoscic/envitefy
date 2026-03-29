type BrowserDiscoveryDepth = 0 | 1;

type BrowserDiscoveryAction = {
  tag: "a" | "button";
  label: string;
  href: string | null;
};

export type BrowserDiscoveryCandidate = {
  label: string;
  url: string;
  sourceUrl: string;
  depth: BrowserDiscoveryDepth;
  sameHost: boolean;
  contentType?: string | null;
  openedVia: "anchor" | "button" | "popup" | "download" | "navigation";
  discoveryMethod: "playwright";
};

export type BrowserDiscoveryPage = {
  url: string;
  title: string | null;
  depth: BrowserDiscoveryDepth;
  text: string;
  sourceUrl: string;
};

export type BrowserDiscoveryResult = {
  candidates: BrowserDiscoveryCandidate[];
  pages: BrowserDiscoveryPage[];
};

type BrowserDiscoveryOptions = {
  maxChildPages?: number;
  maxActionablesPerPage?: number;
  timeoutMs?: number;
};

type PlaywrightPage = {
  url(): string;
  title(): Promise<string>;
  goto(
    url: string,
    options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle"; timeout?: number }
  ): Promise<unknown>;
  waitForLoadState(
    state?: "load" | "domcontentloaded" | "networkidle",
    options?: { timeout?: number }
  ): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  locator(selector: string): {
    count(): Promise<number>;
    nth(index: number): {
      innerText(options?: { timeout?: number }): Promise<string>;
      getAttribute(name: string, options?: { timeout?: number }): Promise<string | null>;
      click(options?: { timeout?: number }): Promise<void>;
    };
  };
  evaluate<T>(fn: () => T): Promise<T>;
  context(): PlaywrightBrowserContext;
  close(options?: { runBeforeUnload?: boolean }): Promise<void>;
};

type PlaywrightDownload = {
  url(): string;
};

type PlaywrightBrowserContext = {
  newPage(): Promise<PlaywrightPage>;
  waitForEvent(name: "page", options?: { timeout?: number }): Promise<PlaywrightPage>;
  close(): Promise<void>;
};

type PlaywrightBrowser = {
  newContext(options?: { acceptDownloads?: boolean }): Promise<PlaywrightBrowserContext>;
  close(): Promise<void>;
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrl(value: unknown): string {
  const raw = safeString(value);
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) return "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function normalizeText(value: unknown): string {
  return safeString(value).replace(/\s+/g, " ").trim();
}

function isAssetUrl(url: string): boolean {
  return /\.(pdf|png|jpe?g|webp)(\?|#|$)/i.test(url);
}

function isSafeActionLabel(label: string): boolean {
  return /\b(schedule|info|packet|program|roster|rotation|result|score|hotel|photo|video|parking|map|admission|ticket|division|document|guide|venue|travel)\b/i.test(
    label
  );
}

function isTrustedExternalResourceUrl(input: string): boolean {
  try {
    const hostname = new URL(input).hostname.toLowerCase();
    return [
      "api.groupbook.io",
      "jotform.com",
      "form.jotform.com",
      "pci.jotform.com",
      "meetscoresonline.com",
      "results.scorecatonline.com",
    ].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function isSameHost(input: string, rootUrl: string): boolean {
  try {
    return new URL(input).host === new URL(rootUrl).host;
  } catch {
    return false;
  }
}

function candidateKey(candidate: BrowserDiscoveryCandidate): string {
  return `${candidate.url}|${candidate.sourceUrl}|${candidate.depth}|${candidate.openedVia}`;
}

function pageKey(page: BrowserDiscoveryPage): string {
  return `${page.url}|${page.depth}`;
}

async function collectPageText(page: PlaywrightPage): Promise<string> {
  try {
    const text = await page.evaluate(() => {
      const body = document.body;
      return body ? body.innerText || "" : "";
    });
    return normalizeText(text);
  } catch {
    return "";
  }
}

async function collectVisibleActions(page: PlaywrightPage): Promise<BrowserDiscoveryAction[]> {
  try {
    const actions = await page.evaluate(() => {
      const isVisible = (el: Element) => {
        const node = el as HTMLElement;
        const style = window.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
      const anchors = Array.from(document.querySelectorAll("a[href]"))
        .filter(isVisible)
        .map((el) => {
          const node = el as HTMLAnchorElement;
          const label = normalize(
            node.innerText || node.getAttribute("aria-label") || node.title || node.href || ""
          );
          return {
            tag: "a" as const,
            label,
            href: normalize(node.href || ""),
          };
        });

      const buttons = Array.from(document.querySelectorAll("button, [role='button']"))
        .filter(isVisible)
        .map((el) => {
          const node = el as HTMLElement;
          const label = normalize(
            node.innerText || node.getAttribute("aria-label") || node.getAttribute("title") || ""
          );
          return {
            tag: "button" as const,
            label,
            href: null,
          };
        });

      return [...anchors, ...buttons].filter((item) => item.label || item.href);
    });
    return Array.isArray(actions) ? actions : [];
  } catch {
    return [];
  }
}

async function visitLinkedPage(
  context: PlaywrightBrowserContext,
  candidate: BrowserDiscoveryCandidate,
  timeoutMs: number
): Promise<BrowserDiscoveryPage | null> {
  const next = await context.newPage();
  try {
    await next.goto(candidate.url, {
      waitUntil: "networkidle",
      timeout: timeoutMs,
    });
    await next.waitForTimeout(250);
    const text = await collectPageText(next);
    return {
      url: normalizeUrl(next.url()) || candidate.url,
      title: normalizeText(await next.title()) || null,
      depth: 1,
      text,
      sourceUrl: candidate.sourceUrl,
    };
  } catch {
    return null;
  } finally {
    await next.close().catch(() => {});
  }
}

export async function collectDiscoveryBrowserData(
  rootUrl: string,
  options?: BrowserDiscoveryOptions
): Promise<BrowserDiscoveryResult> {
  const normalizedRootUrl = normalizeUrl(rootUrl);
  if (!normalizedRootUrl) {
    return { candidates: [], pages: [] };
  }

  const { chromium } = (await import("playwright")) as {
    chromium: {
      launch(options?: { headless?: boolean }): Promise<PlaywrightBrowser>;
    };
  };

  const timeoutMs = options?.timeoutMs ?? 10_000;
  const maxChildPages = options?.maxChildPages ?? 3;
  const maxActionablesPerPage = options?.maxActionablesPerPage ?? 12;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const candidateMap = new Map<string, BrowserDiscoveryCandidate>();
  const pageMap = new Map<string, BrowserDiscoveryPage>();

  const addCandidate = (candidate: BrowserDiscoveryCandidate | null) => {
    if (!candidate?.url) return;
    const key = candidateKey(candidate);
    if (!candidateMap.has(key)) {
      candidateMap.set(key, candidate);
    }
  };

  const addPage = (discoveredPage: BrowserDiscoveryPage | null) => {
    if (!discoveredPage?.url) return;
    const key = pageKey(discoveredPage);
    if (!pageMap.has(key)) {
      pageMap.set(key, discoveredPage);
    }
  };

  const buildCandidate = (
    url: string,
    label: string,
    sourceUrl: string,
    depth: BrowserDiscoveryDepth,
    openedVia: BrowserDiscoveryCandidate["openedVia"]
  ): BrowserDiscoveryCandidate | null => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) return null;
    const normalizedLabel = normalizeText(label) || "Resource link";
    const sameHost = isSameHost(normalizedUrl, normalizedRootUrl);
    if (!sameHost && !isTrustedExternalResourceUrl(normalizedUrl)) return null;
    return {
      label: normalizedLabel,
      url: normalizedUrl,
      sourceUrl,
      depth,
      sameHost,
      contentType: null,
      openedVia,
      discoveryMethod: "playwright",
    };
  };

  const collectAnchorCandidates = async (
    currentPage: PlaywrightPage,
    sourceUrl: string,
    depth: BrowserDiscoveryDepth
  ) => {
    const actions = await collectVisibleActions(currentPage);
    const anchors = actions
      .filter((item) => item.tag === "a" && item.href)
      .slice(0, maxActionablesPerPage);
    for (const item of anchors) {
      const candidate = buildCandidate(item.href || "", item.label, sourceUrl, depth, "anchor");
      addCandidate(candidate);
    }
  };

  try {
    await page.goto(normalizedRootUrl, {
      waitUntil: "networkidle",
      timeout: timeoutMs,
    });
    await page.waitForTimeout(350);
    await collectAnchorCandidates(page, normalizedRootUrl, 0);

    const rootText = await collectPageText(page);
    addPage({
      url: normalizedRootUrl,
      title: normalizeText(await page.title()) || null,
      depth: 0,
      text: rootText,
      sourceUrl: normalizedRootUrl,
    });

    const buttonLocator = page.locator("button, [role='button']");
    const buttonCount = Math.min(await buttonLocator.count(), maxActionablesPerPage);
    for (let index = 0; index < buttonCount; index += 1) {
      const button = buttonLocator.nth(index);
      const label = normalizeText(
        (await button.innerText({ timeout: 500 }).catch(() => "")) ||
          (await button.getAttribute("aria-label", { timeout: 500 }).catch(() => "")) ||
          (await button.getAttribute("title", { timeout: 500 }).catch(() => ""))
      );
      if (!label || !isSafeActionLabel(label)) continue;

      const popupPromise = context.waitForEvent("page", { timeout: 2500 }).catch(() => null);
      const downloadPromise = page.waitForEvent("download", { timeout: 2500 }).catch(() => null);
      const beforeUrl = normalizeUrl(page.url()) || normalizedRootUrl;
      await button.click({ timeout: 3000 }).catch(() => {});
      const popup = await popupPromise;
      const download = (await downloadPromise) as PlaywrightDownload | null;

      if (popup) {
        await popup.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => {});
        await popup.waitForTimeout(250).catch(() => {});
        const popupUrl = normalizeUrl(popup.url());
        const popupText = await collectPageText(popup);
        if (popupUrl) {
          addCandidate(buildCandidate(popupUrl, label, beforeUrl, 1, "popup"));
          addPage({
            url: popupUrl,
            title: normalizeText(await popup.title().catch(() => "")) || null,
            depth: 1,
            text: popupText,
            sourceUrl: beforeUrl,
          });
          await collectAnchorCandidates(popup, popupUrl, 1);
        }
        await popup.close().catch(() => {});
        continue;
      }

      if (download) {
        addCandidate(
          buildCandidate(download.url(), label, beforeUrl, 1, "download")
        );
        continue;
      }

      const afterUrl = normalizeUrl(page.url());
      if (afterUrl && afterUrl !== beforeUrl) {
        addCandidate(buildCandidate(afterUrl, label, beforeUrl, 1, "navigation"));
        const navigationText = await collectPageText(page);
        addPage({
          url: afterUrl,
          title: normalizeText(await page.title().catch(() => "")) || null,
          depth: 1,
          text: navigationText,
          sourceUrl: beforeUrl,
        });
        await collectAnchorCandidates(page, afterUrl, 1);
        await page.goto(beforeUrl, {
          waitUntil: "networkidle",
          timeout: timeoutMs,
        }).catch(() => {});
        await page.waitForTimeout(250).catch(() => {});
      }
    }

    const childCandidates = [...candidateMap.values()]
      .filter((candidate) => candidate.depth === 0 && candidate.sameHost && !isAssetUrl(candidate.url))
      .slice(0, maxChildPages);
    for (const candidate of childCandidates) {
      const discoveredPage = await visitLinkedPage(context, candidate, timeoutMs);
      addPage(discoveredPage);
      if (!discoveredPage) continue;
      const tempPage = await context.newPage();
      try {
        await tempPage.goto(discoveredPage.url, {
          waitUntil: "networkidle",
          timeout: timeoutMs,
        });
        await tempPage.waitForTimeout(200);
        await collectAnchorCandidates(tempPage, discoveredPage.url, 1);
      } catch {
        // Best-effort child-page collection.
      } finally {
        await tempPage.close().catch(() => {});
      }
    }
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  return {
    candidates: [...candidateMap.values()],
    pages: [...pageMap.values()],
  };
}
