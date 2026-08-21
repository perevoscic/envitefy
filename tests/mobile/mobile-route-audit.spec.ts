import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type BrowserContext, type Page } from "playwright/test";
import {
  expectIntentionalHorizontalRegions,
  expectMobileFormTextDoesNotTriggerZoom,
  expectNoDocumentOverflow,
  expectPrimaryContent,
  expectTouchSafeControls,
} from "./assertions";
import { MOBILE_ROUTE_CASES, resolveMobileAuditPath } from "./route-manifest";
import type { MobileAuditCase, MobileAuditPersona } from "./types";

const authStatePath = (persona: MobileAuditPersona) =>
  path.join(process.cwd(), "qa-artifacts", "mobile-auth", `${persona}.json`);

const baselineProjects = new Set(["phone-390", "desktop-1440"]);
const fullAudit = process.env.MOBILE_QA_FULL === "1";
const visualAudit = process.env.MOBILE_QA_VISUAL === "1";

async function openAuditPage(
  browser: Browser,
  route: MobileAuditCase,
  projectUse: Record<string, unknown>,
): Promise<{ context: BrowserContext; page: Page }> {
  const storageState = route.persona === "anonymous" ? undefined : authStatePath(route.persona);
  const context = await browser.newContext({
    baseURL: String(projectUse.baseURL || "http://localhost:3000"),
    viewport: projectUse.viewport as { width: number; height: number },
    storageState,
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  const page = await context.newPage();
  return { context, page };
}

for (const route of MOBILE_ROUTE_CASES) {
  test(`${route.id} is mobile-safe`, async ({ browser }, testInfo) => {
    test.skip(
      !fullAudit && !route.critical && !baselineProjects.has(testInfo.project.name),
      "Noncritical routes run at every width in the full audit.",
    );
    const resolvedPath = resolveMobileAuditPath(route);
    test.skip(
      resolvedPath === null,
      `Missing ${route.fixtureEnvironmentVariable}; dynamic fixture route was not audited.`,
    );
    const statePath = authStatePath(route.persona);
    test.skip(
      route.persona !== "anonymous" && !fs.existsSync(statePath),
      `Missing ignored authentication state ${statePath}.`,
    );

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const { context, page } = await openAuditPage(
      browser,
      route,
      testInfo.project.use as Record<string, unknown>,
    );
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
      await page.goto(resolvedPath as string, { waitUntil: "domcontentloaded" });
      await expectPrimaryContent(page, route.readySelector || "main, [role='main']");
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => {
        for (const animation of document.getAnimations()) {
          try {
            animation.finish();
          } catch {
            // Infinite and scroll-driven animations are not relevant to the static audit state.
          }
        }
      });
      await page.waitForTimeout(120);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .exclude("[data-mobile-a11y-ignore]")
        .exclude(".cta-roller-content[aria-hidden='true']")
        .analyze();
      const seriousAccessibilityViolations = accessibility.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact || ""),
      );
      const accessibilitySummary = seriousAccessibilityViolations.map((violation) => ({
        help: violation.help,
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.slice(0, 8).map((node) => node.target.join(" ")),
      }));
      expect(
        accessibilitySummary,
        `Serious accessibility violations at ${page.url()}`,
      ).toEqual([]);
      await expectNoDocumentOverflow(page, [
        "[data-mobile-horizontal-scroll]",
        ...(route.allowedHorizontalRegions || []),
      ]);
      await expectIntentionalHorizontalRegions(page, route.allowedHorizontalRegions);

      const viewport = testInfo.project.use.viewport as { width: number; height: number };
      if (viewport.width < 768) {
        await expectMobileFormTextDoesNotTriggerZoom(page);
        await expectTouchSafeControls(page);
      }

      for (const interaction of route.interactions || []) {
        const target = interaction.selector
          ? page.locator(interaction.selector)
          : page.getByRole(interaction.role || "button", {
              name: interaction.accessibleName,
            });
        await target.first().click();
        if (interaction.expectedSelector) {
          await expect(page.locator(interaction.expectedSelector).first()).toBeVisible();
        }
      }

      if (visualAudit) {
        const masks = (route.visualMaskSelectors || []).map((selector) => page.locator(selector));
        await expect(page).toHaveScreenshot(`${route.id}.png`, {
          fullPage: true,
          mask: masks,
        });
      }

      const actionableConsoleErrors = consoleErrors.filter(
        (message) => !/ERR_NETWORK_ACCESS_DENIED|ERR_BLOCKED_BY_CLIENT/.test(message),
      );
      expect(pageErrors, `Page errors at ${page.url()}`).toEqual([]);
      expect(actionableConsoleErrors, `Console errors at ${page.url()}`).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
