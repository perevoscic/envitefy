import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

async function waitForSidebarToSettle(page) {
  await page.locator('[data-app-navigation="sidebar"]').waitFor({ state: "attached" });
  let last = ""; let stable = 0;
  for (let attempt = 0; attempt < 30; attempt++) {
    const current = await page.locator('[data-app-navigation="sidebar"]').evaluate(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return JSON.stringify([Math.round(rect.x), Math.round(rect.width), style.transform, style.opacity, element.getAttribute("aria-hidden"), element.getAttribute("role")]);
    });
    stable = current === last ? stable + 1 : 0;
    if (stable >= 4) return;
    last = current;
    await page.waitForTimeout(100);
  }
  throw new Error("Sidebar layout did not settle within three seconds.");
}

async function observe(page) {
  return page.evaluate(() => {
    const sidebar = document.querySelector('[data-app-navigation="sidebar"]');
    const textarea = document.querySelector("textarea");
    const rectangle = element => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const sidebarRect = rectangle(sidebar);
    const composerRect = rectangle(textarea);
    const sidebarStyle = sidebar ? getComputedStyle(sidebar) : null;
    const point = composerRect ? { x: composerRect.x + composerRect.width / 2, y: composerRect.y + composerRect.height / 2 } : null;
    const hit = point ? document.elementFromPoint(point.x, point.y) : null;
    const composerHit = Boolean(textarea && (hit === textarea || textarea.contains(hit)));
    return {
      viewport: { width: innerWidth, height: innerHeight, desktopBreakpoint: matchMedia("(min-width: 1024px)").matches, touch: matchMedia("(hover: none), (pointer: coarse)").matches },
      sidebar: { rect: sidebarRect, ariaHidden: sidebar?.getAttribute("aria-hidden"), inert: sidebar?.inert, role: sidebar?.getAttribute("role"), opacity: sidebarStyle?.opacity, transform: sidebarStyle?.transform, state: sidebar?.getAttribute("data-sidebar-state") },
      composer: { rect: composerRect, point, receivesPointer: composerHit, interceptedBy: composerHit ? null : hit?.closest('[data-app-navigation]')?.getAttribute("data-app-navigation") || hit?.tagName || null },
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      storedMobileCollapsed: localStorage.getItem("sidebar:collapsed"),
      focusInSidebar: Boolean(sidebar?.contains(document.activeElement)),
    };
  });
}

/** Read-only navigation audit: synthetic credentials, no chat messages or paid requests. */
export async function runResponsiveAudit({ baseUrl, account, runDir }) {
  const origin = new URL(baseUrl);
  if (origin.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname)) throw new Error("Responsive campaign audit requires a loopback application.");
  const attemptId = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const outputDir = path.join(runDir, "responsive-audit", attemptId);
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const result = { startedAt: new Date().toISOString(), attemptId, paidRequests: 0, observations: [], evidence: [], blockedMutations: [], findings: [], checks: {} };
  try {
    for (const mode of ["fresh-mobile", "desktop-to-mobile"]) {
      const context = await browser.newContext(mode === "fresh-mobile"
        ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
        : { viewport: { width: 1280, height: 900 } });
      try {
        const csrf = await context.request.get(`${baseUrl}/api/auth/csrf`);
        const csrfToken = (await csrf.json()).csrfToken;
        await context.request.post(`${baseUrl}/api/auth/callback/credentials`, { form: { csrfToken, email: account.email, password: account.password, json: "true", callbackUrl: `${baseUrl}/chat` } });
        const session = await (await context.request.get(`${baseUrl}/api/auth/session`)).json();
        if (session.user?.email !== account.email) throw new Error("Responsive audit could not authenticate its synthetic account.");
        await context.route("**/api/**", async route => {
          const request = route.request();
          if (!["GET", "HEAD"].includes(request.method())) {
            result.blockedMutations.push({ method: request.method(), path: new URL(request.url()).pathname });
            await route.abort("blockedbyclient");
          } else await route.continue();
        });
        const page = await context.newPage();
        await page.goto(`${baseUrl}/chat`, { waitUntil: "domcontentloaded", timeout: 90_000 });
        await page.locator("textarea").waitFor({ state: "visible", timeout: 90_000 });
        const essential = page.getByRole("button", { name: "Essential only", exact: true });
        // Fresh contexts have no saved preference; wait for authenticated consent hydration.
        await essential.waitFor({ state: "visible", timeout: 15_000 });
        await essential.click();
        await essential.waitFor({ state: "hidden" });
        await waitForSidebarToSettle(page);
        if (mode === "desktop-to-mobile") {
          result.observations.push({ name: "desktop-before-resize", ...await observe(page) });
          await page.setViewportSize({ width: 390, height: 844 });
          await waitForSidebarToSettle(page);
        }
        result.observations.push({ name: mode, ...await observe(page) });
        const screenshot = path.join(outputDir, `${mode}.png`);
        await page.screenshot({ path: screenshot, fullPage: true });
        result.evidence.push({ kind: "screenshot", path: path.relative(runDir, screenshot).replaceAll("\\", "/") });
        if (mode === "fresh-mobile") {
          const triggers = page.getByRole("button", { name: "Open navigation", exact: true });
          const visibleTriggers = [];
          for (const trigger of await triggers.all()) {
            if (await trigger.isVisible()) visibleTriggers.push(await trigger.getAttribute("data-app-navigation") || "unmarked");
          }
          if (visibleTriggers.length > 1) result.findings.push({ code: "duplicate_mobile_navigation_triggers", visibleTriggers, severity: "low" });
          const reveal = page.locator('[data-app-navigation="reveal"]');
          const open = await reveal.isVisible() ? reveal : triggers.first();
          if (await open.isVisible()) {
            await open.click();
            await waitForSidebarToSettle(page);
            result.observations.push({ name: "mobile-explicit-open", ...await observe(page) });
            await page.keyboard.press("Escape");
            await waitForSidebarToSettle(page);
            result.observations.push({ name: "mobile-escape-close", ...await observe(page) });
          }
        }
      } finally { await context.close(); }
    }
  } catch (error) {
    result.failure = String(error.message || error).replaceAll(account.password, "[redacted]");
  } finally {
    for (const name of ["fresh-mobile", "desktop-to-mobile", "mobile-escape-close"]) {
      const entry = result.observations.find(item => item.name === name);
      result.checks[name] = Boolean(entry?.sidebar.ariaHidden === "true" && entry.sidebar.inert && entry.composer.receivesPointer && !entry.horizontalOverflow);
    }
    result.checks.explicitOpenWorks = result.observations.find(item => item.name === "mobile-explicit-open")?.sidebar.role === "dialog";
    result.passed = !result.failure && Object.values(result.checks).every(Boolean);
    result.finishedAt = new Date().toISOString();
    await writeFile(path.join(outputDir, "result.json"), JSON.stringify(result, null, 2));
    await writeFile(path.join(runDir, "responsive-audit-latest.json"), JSON.stringify(result, null, 2));
    await browser.close();
  }
  return result;
}
