import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

test("category callouts and dialogs preserve category, authentication, responsive layout and explicit handoff", {
  timeout: 180000,
}, async () => {
  execFileSync("bun", ["scripts/build-category-custom-design-fixture.mjs"], { stdio: "pipe" });
  const out = path.resolve("output/category-custom-design");
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [],
    requests = [],
    writes = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  const origin = "http://localhost:43129";
  const image = await sharp({
    create: { width: 60, height: 40, channels: 3, background: "#15243b" },
  })
    .webp()
    .toBuffer();
  const imageUrl = `data:image/webp;base64,${image.toString("base64")}`;
  const design = {
    version: 1,
    name: "Midnight gold",
    description: "Navy and gold",
    layout: "banner",
    font: "modern",
    colors: { page: "#15243b", surface: "#182940", ink: "#ffffff", accent: "#725620" },
  };
  const signupTheme = {
    ...design,
    composition: "botanical",
    board: "outline",
    motif: "sprig",
    reverse: false,
    fontPair: "friendly",
    colors: { ...design.colors, soft: "#182940", secondary: "#b8a681" },
  };
  const details = {
    title: "An evening together",
    description: "Bring your own picnic.",
    date: "",
    time: "",
    endDate: "",
    endTime: "",
    timezone: "",
    venue: "",
    location: "",
    host: "",
    rsvpEmail: "",
    rsvpPhone: "",
    rsvpEnabled: false,
    sections: [],
    registryLinks: [],
  };
  await page.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.origin !== origin) return route.abort();
    if (request.method() === "POST") {
      writes.push(url.pathname);
      const body = request.postDataJSON();
      requests.push({ path: url.pathname, body });
      if (url.pathname === "/api/event-themes/generate") {
        return route.fulfill({
          json: {
            version: 1,
            category: body.category,
            design,
            artwork: imageUrl,
            details: body.currentDetails || details,
          },
        });
      }
      if (url.pathname === "/api/signup-themes/generate")
        return route.fulfill({
          json: {
            theme: signupTheme,
            artwork: {
              type: "image/webp",
              name: "midnight.webp",
              dataUrl: imageUrl,
              width: 60,
              height: 40,
            },
          },
        });
      return route.fulfill({ status: 500, json: { error: "Unexpected write" } });
    }
    if (["/entry.js", "/entry.css", "/global.css"].includes(url.pathname)) {
      return route.fulfill({
        contentType: url.pathname.endsWith(".js") ? "text/javascript" : "text/css",
        body: await fs.readFile(path.join(out, url.pathname.slice(1))),
      });
    }
    if (url.pathname.startsWith("/templates/") || url.pathname.startsWith("/fonts/")) {
      const filename = path.resolve("public", url.pathname.slice(1));
      if (filename.startsWith(path.resolve("public") + path.sep)) {
        try {
          return await route.fulfill({ body: await fs.readFile(filename) });
        } catch {}
      }
      return route.fulfill({ status: 404 });
    }
    return route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en"><head><title>Category design check</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body class="font-vars" style="margin:0;background:#faf8fc"><div id="root"></div><script type="module" src="/entry.js"></script></body></html>`,
    });
  });
  const goto = async (category, extras = "") => {
    await page.goto(`${origin}/gallery?category=${category}${extras}`);
    await page.waitForFunction(() => Boolean(window.fixture));
  };
  const noOverflow = async () =>
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  try {
    await goto("general");
    const categories = await page.evaluate(() => window.fixture.categories);
    for (const category of categories) {
      await goto(category);
      const profile = await page.evaluate((category) => window.fixture.profile(category), category);
      const callout = page.locator(`[data-custom-design-category="${category}"]`);
      await callout.getByRole("heading", { name: profile.headline, exact: true }).waitFor();
      assert.equal(await callout.locator("svg").count(), 1);
      for (const [width, height] of [
        [1280, 900],
        [640, 900],
        [320, 812],
      ]) {
        await page.setViewportSize({ width, height });
        await noOverflow();
        const button = callout.getByRole("button", { name: "Create with Envitefy", exact: true });
        const box = await button.boundingBox();
        assert.ok(box.height >= 44 && box.x >= 0 && box.x + box.width <= width, category);
        if (
          ["birthdays", "weddings", "football", "signup-forms"].includes(category) &&
          width !== 640
        ) {
          await callout.screenshot({ path: path.join(out, `${category}-callout-${width}.png`) });
        }
      }
      const before = requests.length;
      await callout.getByRole("button", { name: "Create with Envitefy", exact: true }).focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("heading", { name: profile.headline, exact: true }).waitFor();
      assert.equal(await dialog.locator("textarea").inputValue(), "");
      assert.equal(
        await dialog.locator("textarea").getAttribute("placeholder"),
        profile.placeholder,
      );
      await page.waitForFunction(() => document.activeElement?.tagName === "TEXTAREA");
      assert.equal(requests.length, before, "opening a dialog must not generate or save");
      for (const [width, height] of [
        [320, 812],
        [844, 390],
        [1280, 900],
      ]) {
        await page.setViewportSize({ width, height });
        await noOverflow();
        const close = await dialog.getByRole("button", { name: /Close custom/ }).boundingBox();
        assert.ok(
          close.x >= 0 &&
            close.y >= 0 &&
            close.x + close.width <= width &&
            close.y + close.height <= height,
          category,
        );
        const action = await dialog
          .getByRole("button", { name: "Create with Envitefy", exact: true })
          .boundingBox();
        assert.ok(
          action.y + action.height <= height && action.x + action.width <= width,
          `${category} footer`,
        );
      }
      if (["weddings", "football", "signup-forms"].includes(category)) {
        const a11y = await new AxeBuilder({ page })
          .include('[role="dialog"]')
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();
        assert.deepEqual(
          a11y.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
          category,
        );
        await page.screenshot({ path: path.join(out, `${category}-dialog.png`) });
      }
      await dialog
        .locator("textarea")
        .fill(
          "Use midnight navy and gold with clean modern lettering. Title: An evening together. Bring your own picnic.",
        );
      await dialog.getByRole("button", { name: "Create with Envitefy", exact: true }).click();
      const signup = category === "signup-forms";
      const accept = dialog.getByRole("button", {
        name: signup ? "Use this theme →" : "Use this design",
        exact: true,
      });
      await accept.waitFor();
      assert.equal(
        requests.at(-1).path,
        signup ? "/api/signup-themes/generate" : "/api/event-themes/generate",
      );
      if (!signup) assert.equal(requests.at(-1).body.category, category);
      assert.equal(requests.at(-1).body.prompt.includes(profile.placeholder), false);
      if (category === "weddings") {
        await dialog.getByRole("button", { name: "Describe a change", exact: true }).click();
        await dialog.locator("textarea").fill("Make the gold details more delicate.");
        await dialog.getByRole("button", { name: "Update design", exact: true }).click();
        await accept.waitFor();
        assert.deepEqual(requests.at(-1).body.currentDetails, details);
        assert.deepEqual(requests.at(-1).body.currentDesign, design);
      }
      await accept.click();
      await page.waitForFunction(() => window.navigations?.length);
      const handoff = await page.evaluate(
        ({ category, signup }) => {
          const url = new URL(window.navigations.at(-1), location.origin);
          return signup
            ? window.fixture.takeSignupTheme(url.searchParams.get("themePreview"))
            : window.fixture.takeCustomEventPage(url.searchParams.get("themePreview"), category);
        },
        { category, signup },
      );
      assert.ok(handoff);
      if (signup) assert.equal(handoff.appearance.customTheme.name, design.name);
      else {
        assert.equal(handoff.category, category);
        assert.deepEqual(handoff.details, details);
        assert.deepEqual(handoff.design.colors, design.colors);
      }
    }
    for (const category of ["football", "signup-forms"]) {
      await goto(category, "&status=unauthenticated");
      const callout = page.locator("[data-custom-design-category]");
      assert.ok(
        await callout
          .getByRole("button", { name: "Create with Envitefy", exact: true })
          .isDisabled(),
      );
      await callout.getByRole("button", { name: "Sign in to generate" }).click();
      await page.getByRole("button", { name: "Continue test sign-in" }).click();
      await page.getByRole("dialog").waitFor();
      assert.equal(await page.getByRole("dialog").locator("textarea").inputValue(), "");
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await goto(category, "&customTheme=1");
      await page.getByRole("dialog").waitFor();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /Close custom/ })
        .click();
      await goto(category, "&status=loading");
      assert.ok(
        await page.getByRole("button", { name: "Create with Envitefy", exact: true }).isDisabled(),
      );
      assert.equal(await page.getByRole("button", { name: "Sign in to generate" }).count(), 0);
    }
    await goto("signup-forms", "&featured=1");
    assert.equal(await page.locator("[data-custom-design-category]").count(), 0);
    assert.ok(
      writes.every((url) =>
        ["/api/event-themes/generate", "/api/signup-themes/generate"].includes(url),
      ),
      JSON.stringify(writes),
    );
    assert.deepEqual(errors, []);
  } catch (error) {
    console.error({
      url: page.url(),
      errors,
      activeElement: await page.evaluate(() => document.activeElement?.outerHTML),
    });
    await page.screenshot({ path: path.join(out, "failure.png") });
    throw error;
  } finally {
    await browser.close();
  }
});
