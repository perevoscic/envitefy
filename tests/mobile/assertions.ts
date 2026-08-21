import { expect, type Page } from "playwright/test";

type OverflowOffender = {
  selector: string;
  left: number;
  right: number;
  width: number;
};

export async function expectPrimaryContent(page: Page, selector: string) {
  const primary = page.locator(selector).first();
  await expect(primary).toBeVisible();
  await expect(primary).not.toBeEmpty();
}

export async function expectNoDocumentOverflow(
  page: Page,
  allowedHorizontalRegions: string[] = [],
) {
  const result = await page.evaluate((allowedSelectors) => {
    const viewportWidth = document.documentElement.clientWidth;
    const allowed = allowedSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]);
    const isAllowed = (element: Element) => allowed.some((region) => region.contains(element));
    const selectorFor = (element: Element) => {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const testId = element.getAttribute("data-testid");
      if (testId) return `[data-testid="${testId}"]`;
      return element.tagName.toLowerCase() +
        [...element.classList].slice(0, 3).map((name) => `.${CSS.escape(name)}`).join("");
    };
    const offenders: OverflowOffender[] = [];

    for (const element of document.querySelectorAll("body *")) {
      if (isAllowed(element)) continue;
      if (element.closest('[aria-hidden="true"], [inert]')) continue;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      if (rect.left < -1 || rect.right > viewportWidth + 1) {
        offenders.push({
          selector: selectorFor(element),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        });
      }
      if (offenders.length >= 12) break;
    }

    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      offenders,
    };
  }, allowedHorizontalRegions);

  expect(
    result.documentWidth,
    `Document overflow at ${page.url()}: ${JSON.stringify(result.offenders)}`,
  ).toBeLessThanOrEqual(result.viewportWidth + 1);
  expect(
    result.bodyWidth,
    `Body overflow at ${page.url()}: ${JSON.stringify(result.offenders)}`,
  ).toBeLessThanOrEqual(result.viewportWidth + 1);
}

export async function expectIntentionalHorizontalRegions(
  page: Page,
  selectors: string[] = [],
) {
  const allSelectors = [...new Set(["[data-mobile-horizontal-scroll]", ...selectors])];
  for (const selector of allSelectors) {
    const regions = page.locator(selector);
    const count = await regions.count();
    if (selector === "[data-mobile-horizontal-scroll]" && count === 0) continue;
    expect(count, `Missing declared horizontal region ${selector}`).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const region = regions.nth(index);
      const details = await region.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          accessibleName:
            element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || "",
          keyboardReachable:
            element instanceof HTMLElement &&
            (element.tabIndex >= 0 || ["NAV", "TABLE"].includes(element.tagName)),
          overflowX: style.overflowX,
        };
      });
      expect(details.accessibleName, `${selector} needs an accessible name`).not.toBe("");
      expect(details.keyboardReachable, `${selector} must be keyboard reachable`).toBe(true);
      expect(["auto", "scroll"], `${selector} must explicitly scroll horizontally`).toContain(
        details.overflowX,
      );
    }
  }
}

export async function expectMobileFormTextDoesNotTriggerZoom(page: Page) {
  const offenders = await page.evaluate(() =>
    [...document.querySelectorAll("input, textarea, select")]
      .filter((element) => {
        const control = element as HTMLInputElement;
        if (control.type === "hidden" || control.disabled) return false;
        if (control.closest('[aria-hidden="true"], [inert]')) return false;
        const rect = control.getBoundingClientRect();
        if (
          rect.width < 1 ||
          rect.height < 1 ||
          rect.right <= 0 ||
          rect.left >= window.innerWidth ||
          rect.bottom <= 0 ||
          rect.top >= window.innerHeight
        ) {
          return false;
        }
        return Number.parseFloat(getComputedStyle(control).fontSize) < 16;
      })
      .slice(0, 12)
      .map((element) => ({
        element: element.tagName.toLowerCase(),
        name:
          element.getAttribute("aria-label") ||
          element.getAttribute("name") ||
          element.getAttribute("placeholder") ||
          "unnamed",
        fontSize: getComputedStyle(element).fontSize,
      })),
  );
  expect(offenders, `Inputs below 16px at ${page.url()}`).toEqual([]);
}

export async function expectTouchSafeControls(page: Page) {
  const offenders = await page.evaluate(() =>
    [...document.querySelectorAll("button, input:not([type='hidden']), select, textarea, [role='button']")]
      .filter((element) => {
        if (element.hasAttribute("data-mobile-touch-exempt")) return false;
        if (element.closest('[aria-hidden="true"], [inert]')) return false;
        const control = element as HTMLButtonElement;
        if (control.disabled) return false;
        const style = getComputedStyle(control);
        const rect = control.getBoundingClientRect();
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          rect.width < 1 ||
          rect.right <= 0 ||
          rect.left >= window.innerWidth ||
          rect.bottom <= 0 ||
          rect.top >= window.innerHeight
        ) {
          return false;
        }
        if (
          control instanceof HTMLInputElement &&
          ["checkbox", "radio"].includes(control.type)
        ) {
          const label = control.closest("label");
          const labelRect = label?.getBoundingClientRect();
          if (labelRect && labelRect.width >= 44 && labelRect.height >= 44) return false;
        }
        return rect.width < 44 || rect.height < 44;
      })
      .slice(0, 12)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text:
            element.getAttribute("aria-label") ||
            element.getAttribute("name") ||
            (element.textContent || "").trim().slice(0, 60),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }),
  );
  expect(offenders, `Controls below 44px at ${page.url()}`).toEqual([]);
}
