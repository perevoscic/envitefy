const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { chromium } = require("playwright");
const buildFixture = require("./lib/build-bun-fixture.cjs");

const output = path.resolve("output/settings-workspace-browser");
const origin = "http://settings-workspace.test";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV9sAAAAASUVORK5CYII=",
  "base64",
);
const fullAccess = {
  policy: "standard",
  allowedProducts: ["snap", "live_card", "event_page", "signup_form"],
  allowedCategories: [
    "general",
    "birthdays",
    "weddings",
    "anniversaries",
    "baby-showers",
    "bridal-showers",
    "gender-reveal",
    "gymnastics",
    "football",
    "sport-events",
    "soccer",
    "cheerleading",
    "dance-ballet",
  ],
};

function executablePath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fs.existsSync(chromium.executablePath())) return chromium.executablePath();
  const chrome = path.join(
    process.env.PROGRAMFILES || "C:\\Program Files",
    "Google/Chrome/Application/chrome.exe",
  );
  return fs.existsSync(chrome) ? chrome : undefined;
}

async function assertNoOverflow(page) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    "settings remain within the viewport",
  );
}

async function assertSharedBackground(page, theme) {
  await page.waitForFunction(
    (mode) => document.documentElement.dataset.theme?.endsWith(`-${mode}`),
    theme,
  );
  const viewport = page.viewportSize();
  const measure = () =>
    page.evaluate(() => {
      const canvas = document.querySelector("[data-settings-canvas]");
      const shell = document.querySelector('[data-app-main-content="true"]');
      const gradient = shell.querySelector('[data-project-gradient-background="true"]');
      const style = getComputedStyle(gradient);
      const bounds = gradient.getBoundingClientRect();
      const ancestors = [];
      for (let element = canvas; element && element !== shell; element = element.parentElement)
        ancestors.push(getComputedStyle(element).backgroundColor);
      return {
        ancestors,
        shell: getComputedStyle(shell).backgroundColor,
        canvasImage: getComputedStyle(canvas).backgroundImage,
        display: style.display,
        visibility: style.visibility,
        image: style.backgroundImage,
        position: style.position,
        pointerEvents: style.pointerEvents,
        top: bounds.top,
        bottom: bounds.bottom,
        height: innerHeight,
        scrollY,
      };
    });
  try {
    await page.setViewportSize({ width: viewport.width, height: 480 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const before = await measure();
    assert.ok(
      before.ancestors.every((color) => color === "rgba(0, 0, 0, 0)"),
      `${theme}: Settings and its wrappers expose the shared background`,
    );
    assert.equal(before.shell, "rgba(0, 0, 0, 0)");
    assert.equal(before.canvasImage, "none");
    assert.equal(before.display, "block");
    assert.equal(before.visibility, "visible");
    assert.match(
      before.image,
      /radial-gradient\(/,
      `${theme}: the real dashboard aurora is visible`,
    );
    assert.equal(before.position, "fixed");
    assert.equal(before.pointerEvents, "none");
    assert.equal(before.top, 0);
    assert.equal(before.bottom, before.height);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForFunction(() => window.scrollY > 0);
    const after = await measure();
    assert.ok(after.scrollY > 0, `${theme}: continuation is checked after scrolling`);
    assert.equal(after.image, before.image, `${theme}: scrolling retains the dashboard gradient`);
    assert.equal(after.top, 0, `${theme}: the background stays at the viewport top`);
    assert.equal(
      after.bottom,
      after.height,
      `${theme}: the background fills the scrolled viewport`,
    );
  } finally {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
}

test("focused settings navigation and explicit profile saves work on desktop and phones", {
  timeout: 180_000,
}, async (t) => {
  buildFixture("scripts/build-settings-workspace-fixture.mjs");
  const script = fs.readFileSync(path.join(output, "settings-workspace.js"));
  const css = fs.readFileSync(path.join(output, "fixture.css"), "utf8");
  const browser = await chromium.launch({ headless: true, executablePath: executablePath() });
  const pageErrors = [],
    unexpected = [];

  async function fixture({ width = 1280, theme = "light", href = "/settings" } = {}) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      colorScheme: theme,
      reducedMotion: "reduce",
    });
    await context.addInitScript(
      (value) => localStorage.setItem("envitefy:appearance:v1", value),
      theme,
    );
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const profile = {
      firstName: "Test",
      lastName: "Host",
      avatarUrl: "/avatar-original.png",
      preferredProvider: "google",
    };
    let activeProfile = profile;
    const writes = [];
    const calendarReads = [];
    let nextCalendarRead = null;
    let failProfileSave = false;
    let failCalendarSave = false;
    const connections = { google: true, microsoft: true, apple: false };
    async function json(route, payload, status = 200) {
      return route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    }
    await context.route("**/*", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.origin !== origin) {
        unexpected.push(request.url());
        return route.abort();
      }
      if (url.pathname === "/fixture.js")
        return route.fulfill({ contentType: "text/javascript", body: script });
      if (url.pathname.startsWith("/avatar-"))
        return route.fulfill({ contentType: "image/png", body: png });
      if (/\.(woff2?|ttf)$/.test(url.pathname)) return route.fulfill({ status: 404, body: "" });
      if (url.pathname === "/api/user/profile") {
        if (request.method() === "GET") return json(route, activeProfile);
        if (request.method() === "PUT") {
          const multipart = request.headers()["content-type"]?.includes("multipart/form-data");
          const body = multipart
            ? Object.fromEntries(
                await new Request(request.url(), {
                  method: "PUT",
                  headers: request.headers(),
                  body: request.postDataBuffer(),
                }).formData(),
              )
            : request.postDataJSON();
          writes.push({ path: url.pathname, method: request.method(), body });
          if (failProfileSave && "firstName" in body)
            return json(route, { error: "Profile save failed. Please try again." }, 503);
          if (failCalendarSave && "preferredProvider" in body)
            return json(route, { error: "Calendar default save failed." }, 503);
          if ("firstName" in body) activeProfile.firstName = body.firstName;
          if ("lastName" in body) activeProfile.lastName = body.lastName;
          if ("preferredProvider" in body) activeProfile.preferredProvider = body.preferredProvider;
          if (body.avatarAction === "replace") activeProfile.avatarUrl = "/avatar-saved.png";
          if (body.avatarAction === "remove") activeProfile.avatarUrl = null;
          return json(route, { ok: true, ...activeProfile });
        }
      }
      if (url.pathname === "/api/user/profile/avatar") {
        writes.push({ path: url.pathname, method: request.method() });
        return json(route, { error: "Avatar writes must be part of explicit profile save." }, 500);
      }
      if (url.pathname === "/api/calendars") {
        calendarReads.push(request.url());
        const payload = {
          ...connections,
          accountEmails: { google: "calendar@settings.test", microsoft: "outlook@settings.test" },
          appleSubscription: { ready: true, connected: true },
        };
        const pending = nextCalendarRead;
        nextCalendarRead = null;
        if (pending) await pending;
        return json(route, payload);
      }
      if (url.pathname === "/api/oauth/disconnect" && request.method() === "POST") {
        const body = request.postDataJSON();
        writes.push({ path: url.pathname, method: request.method(), body });
        connections[body.provider] = false;
        if (activeProfile.preferredProvider === body.provider)
          activeProfile.preferredProvider = null;
        return json(route, { ok: true });
      }
      if (url.pathname === "/api/user/creation-access")
        return json(route, { access: fullAccess, requests: [] });
      if (url.pathname === "/api/user/feature-visibility")
        return json(route, {
          visibleTemplateKeys: ["birthdays", "gymnastics"],
          pinnedCategoryIds: ["birthdays", "gymnastics"],
          defaultCreateIntent: null,
          sportPreferences: {
            primarySport: "gymnastics",
            enabledSports: ["gymnastics"],
            setupCompleted: true,
          },
        });
      if (["/settings", "/admin", "/verify-request", "/card/sample", "/event/sample"].includes(url.pathname))
        return route.fulfill({
          contentType: "text/html",
          body: `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Settings fixture</title><style>${css}</style></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`,
        });
      unexpected.push(`${request.method()} ${request.url()}`);
      return route.abort();
    });
    await page.goto(origin + href);
    await page
      .getByRole("heading", { name: "Settings", exact: true })
      .waitFor()
      .catch(async (cause) => {
        throw new Error(
          `${cause.message}\nPage errors: ${JSON.stringify(pageErrors)}\n${await page.locator("body").innerText()}`,
        );
      });
    return {
      context,
      page,
      profile,
      writes,
      calendarReads,
      setConnections(value) {
        Object.assign(connections, value);
      },
      holdNextCalendarRead() {
        let release;
        nextCalendarRead = new Promise((resolve) => {
          release = resolve;
        });
        return release;
      },
      setFailProfileSave(value) {
        failProfileSave = value;
      },
      setFailCalendarSave(value) {
        failCalendarSave = value;
      },
      setProfile(value) {
        activeProfile = value;
      },
    };
  }

  async function openSection(page, name) {
    const nav = page.getByRole("navigation", { name: "Settings sections", exact: true });
    if (!(await nav.isVisible()))
      await page.getByRole("button", { name: "All settings", exact: true }).click();
    await nav.getByRole("button", { name, exact: true }).click();
  }

  const defaultSwitch = (page, provider) =>
    page.getByRole("switch", {
      name: `Use ${provider} as default calendar`,
      exact: true,
    });
  async function waitCalendarDefaultsReady(page) {
    await defaultSwitch(page, "Google Calendar").waitFor();
    await page.waitForFunction(() => {
      const control = document.querySelector(
        'button[aria-label="Use Google Calendar as default calendar"]',
      );
      return control && !control.disabled;
    });
  }

  try {
    for (const width of [1280, 375])
      for (const theme of ["light", "dark"]) {
        await t.test(`${width}px ${theme}: new, admin and anonymous shells inherit the dashboard background`, async () => {
          for (const href of ["/admin", "/verify-request"]) {
            const { page, context } = await fixture({ width, theme, href });
            try {
              await openSection(page, "Profile");
              await assertSharedBackground(page, theme);
              await assertNoOverflow(page);
            } finally {
              await context.close();
            }
          }
        });
        await t.test(`${width}px ${theme}: authored share shells retain their background exceptions`, async () => {
          for (const href of ["/card/sample", "/event/sample"]) {
            const { page, context } = await fixture({ width, theme, href });
            try {
              assert.equal(await page.locator('[data-project-gradient-background="true"]').count(), 0,
                `${href}: the authored share shell has no application gradient`);
              assert.notEqual(
                await page.locator('[data-app-main-content="true"]').evaluate((element) => getComputedStyle(element).backgroundColor),
                "rgba(0, 0, 0, 0)",
                `${href}: the share shell retains its own page surface`,
              );
            } finally {
              await context.close();
            }
          }
        });
      }

    for (const width of [1280, 375])
      for (const theme of ["light", "dark"]) {
        await t.test(
          `${width}px ${theme}: grouped sections, profile staging, cancellation and retry`,
          async () => {
            const fixtureState = await fixture({ width, theme });
            const { page, context, writes, profile } = fixtureState;
            try {
              const nav = page.getByRole("navigation", { name: "Settings sections", exact: true });
              assert.equal(await nav.getByText("Account", { exact: true }).count(), 1);
              assert.equal(await nav.getByText("Workspace", { exact: true }).count(), 1);
              assert.equal(await nav.getByText("Connections", { exact: true }).count(), 1);
              assert.equal(await page.getByText("Primary sport", { exact: true }).count(), 0);
              if (width < 768) {
                assert.equal(
                  await page.locator("[data-settings-canvas]").getAttribute("data-settings-view"),
                  "list",
                );
                assert.equal(
                  await page.getByLabel("First name", { exact: true }).isVisible(),
                  false,
                );
              }
              await openSection(page, "Profile");
              await page.waitForFunction(
                () => document.querySelector('input[autocomplete="given-name"]')?.value === "Test",
              );
              await assertSharedBackground(page, theme);
              await page.screenshot({
                path: path.join(output, `profile-initial-${width}-${theme}.png`),
                fullPage: true,
              });
              await page.getByLabel("First name", { exact: true }).fill("Draft");
              assert.equal(
                await page.getByRole("textbox", { name: "Email", exact: true }).count(),
                0,
                "read-only email is not presented as an editable field",
              );
              assert.equal(
                (await page.getByText("host@settings.test", { exact: true }).count()) > 0,
                true,
              );
              const originalAvatar = await page
                .locator('img[alt*="profile" i]')
                .last()
                .getAttribute("src");
              await page
                .locator('input[type="file"]')
                .setInputFiles({ name: "new-photo.png", mimeType: "image/png", buffer: png });
              await page.waitForFunction(() =>
                [...document.images].some((image) => image.src.startsWith("blob:")),
              );
              assert.equal(
                writes.length,
                0,
                "typing and selecting a photo never writes before Save changes",
              );
              await page.getByRole("button", { name: "Cancel", exact: true }).click();
              assert.equal(
                await page.getByLabel("First name", { exact: true }).inputValue(),
                "Test",
              );
              assert.equal(
                await page.locator('img[alt*="profile" i]').last().getAttribute("src"),
                originalAvatar,
              );
              assert.equal(writes.length, 0, "Cancel restores the saved profile without writes");

              await page.getByLabel("First name", { exact: true }).fill("Saved");
              await page
                .locator('input[type="file"]')
                .setInputFiles({ name: "new-photo.png", mimeType: "image/png", buffer: png });
              await page.getByRole("button", { name: "Save changes", exact: true }).click();
              await page.waitForFunction(() =>
                [...document.images].some((image) => image.src.includes("avatar-saved.png")),
              );
              assert.equal(writes.length, 1);
              assert.equal(writes[0].body.avatarAction, "replace");
              assert.equal(writes[0].body.firstName, "Saved");
              assert.equal(writes[0].body.avatar.name, "new-photo.png");
              assert.equal(writes[0].body.avatar.size, png.length);
              assert.equal(profile.firstName, "Saved");
              assert.equal(profile.avatarUrl, "/avatar-saved.png");

              await page.getByLabel("Last name", { exact: true }).fill("Retained draft");
              await page.getByRole("button", { name: "Remove", exact: true }).click();
              fixtureState.setFailProfileSave(true);
              await page.getByRole("button", { name: "Save changes", exact: true }).click();
              await page.getByRole("alert").filter({ hasText: "Profile save failed" }).waitFor();
              assert.equal(
                await page.getByLabel("Last name", { exact: true }).inputValue(),
                "Retained draft",
              );
              assert.equal(
                profile.lastName,
                "Host",
                "failed save keeps the persisted profile unchanged",
              );
              assert.equal(profile.avatarUrl, "/avatar-saved.png");
              fixtureState.setFailProfileSave(false);
              await Promise.all([
                page.waitForResponse(
                  (response) =>
                    response.url() === `${origin}/api/user/profile` &&
                    response.request().method() === "PUT" &&
                    response.ok(),
                ),
                page.getByRole("button", { name: "Save changes", exact: true }).click(),
              ]);
              await page.waitForFunction(
                () => ![...document.images].some((image) => image.src.includes("avatar-saved.png")),
              );
              assert.equal(writes.at(-1).body.avatarAction, "remove");
              assert.equal(profile.lastName, "Retained draft");

              await openSection(page, "Sign-in & security");
              assert.equal(
                await page
                  .getByRole("button", { name: "Request account deletion", exact: true })
                  .isVisible(),
                true,
              );
              await openSection(page, "Profile");
              assert.equal(
                await page
                  .getByRole("button", { name: "Request account deletion", exact: true })
                  .isVisible(),
                false,
              );
              await assertNoOverflow(page);
              if (width < 768) {
                await page.getByRole("button", { name: "All settings", exact: true }).click();
                assert.equal(await nav.isVisible(), true);
                assert.equal(
                  await page.getByLabel("First name", { exact: true }).isVisible(),
                  false,
                );
              }
              await page.screenshot({
                path: path.join(output, `settings-${width}-${theme}.png`),
                fullPage: true,
              });
            } finally {
              await context.close();
            }
          },
        );
      }

    for (const [width, theme] of [
      [1280, "dark"],
      [375, "light"],
    ]) {
      await t.test(
        `${width}px: calendars check once on load and refresh only on request`,
        async () => {
          const state = await fixture({ width, theme, href: "/settings#calendars" });
          const { page, context, calendarReads } = state;
          try {
            await waitCalendarDefaultsReady(page);
            assert.equal(calendarReads.length, 1, "one initial connection check");
            await page.clock.install();
            await page.evaluate(() => {
              window.openedCalendarUrls = [];
              window.open = (url) => {
                window.openedCalendarUrls.push(url);
                return null;
              };
              window.dispatchEvent(new Event("blur"));
              window.dispatchEvent(new Event("focus"));
              document.dispatchEvent(new Event("visibilitychange"));
            });
            await openSection(page, "Profile");
            await openSection(page, "Calendars");
            const googleRow = page
              .getByRole("heading", { name: "Google Calendar", exact: true })
              .locator("../..");
            assert.equal(await page.getByRole("button", { name: "Reconnect", exact: true }).count(), 0);
            assert.equal(
              await googleRow.getByText("calendar@settings.test", { exact: true }).isVisible(),
              true,
            );
            await googleRow.getByRole("button", { name: "Disconnect", exact: true }).click();
            const disconnectDialog = page.getByRole("dialog");
            await disconnectDialog.getByRole("button", { name: "Disconnect", exact: true }).click();
            await disconnectDialog.waitFor({ state: "hidden" });
            assert.equal(calendarReads.length, 1, "explicit disconnect updates locally without rechecking connections");
            await googleRow.getByRole("button", { name: "Connect Google Calendar", exact: true }).click();
            await page.clock.runFor(12_000);
            assert.match(
              await page.evaluate(() => window.openedCalendarUrls[0]),
              /^\/api\/google\/auth\?consent=1/,
            );
            assert.equal(
              calendarReads.length,
              1,
              "focus, section clicks and explicit Connect never recheck connections",
            );

            state.setConnections({ google: true, microsoft: false });
            const outlookDefault = defaultSwitch(page, "Outlook Calendar");
            assert.equal(await outlookDefault.isEnabled(), true);
            await page.getByRole("button", { name: "Refresh", exact: true }).click();
            await waitCalendarDefaultsReady(page);
            await outlookDefault.waitFor({ state: "hidden" });
            assert.equal(
              await outlookDefault.count(),
              0,
              "disconnected providers have no default switch",
            );
            assert.equal(
              calendarReads.length,
              2,
              "manual Refresh makes one new check and updates status",
            );
            await page.reload();
            await waitCalendarDefaultsReady(page);
            assert.equal(calendarReads.length, 3, "a new page load checks once again");
            await page.evaluate(() =>
              window.settingsWorkspaceFixture.setAccount("host@settings.test", "Updated session"),
            );
            await page.clock.runFor(20);
            assert.equal(
              calendarReads.length,
              3,
              "a session update for the same account never rechecks",
            );
          } finally {
            await context.close();
          }
        },
      );
      await t.test(
        `${width}px: calendar default failures, retry and confirmed disconnect preserve the other connection`,
        async () => {
          const state = await fixture({ width, theme, href: "/settings#calendars" });
          const { page, context, profile, writes } = state;
          try {
            await waitCalendarDefaultsReady(page);
            const googleDefault = defaultSwitch(page, "Google Calendar");
            const outlookDefault = defaultSwitch(page, "Outlook Calendar");
            assert.equal(await googleDefault.isChecked(), true);
            assert.equal(await outlookDefault.isChecked(), false);
            assert.equal(
              await page.locator("#settings-default-calendar").count(),
              0,
              "no separate default dropdown remains",
            );
            assert.equal(await page.getByRole("combobox").count(), 0);
            assert.equal(
              await defaultSwitch(page, "Apple Calendar").count(),
              0,
              "Apple subscriptions cannot become the connected default",
            );
            const defaultOrder = await googleDefault.evaluate((control) => {
              const container = control.parentElement;
              const email = [...container.children].find((element) => element.textContent === "calendar@settings.test");
              const disconnect = [...container.parentElement.querySelectorAll("button")].find((button) => button.textContent.trim() === "Disconnect");
              const emailBounds = email?.getBoundingClientRect();
              const controlBounds = control.getBoundingClientRect();
              const disconnectBounds = disconnect?.getBoundingClientRect();
              return {
                sameContainer: email?.parentElement === container,
                directlyAfterEmail: email?.nextElementSibling === control,
                emailBottom: emailBounds?.bottom,
                controlTop: controlBounds.top,
                controlBottom: controlBounds.bottom,
                disconnectTop: disconnectBounds?.top,
              };
            });
            assert.equal(defaultOrder.sameContainer, true, "email and default control share the existing provider info container");
            assert.equal(defaultOrder.directlyAfterEmail, true, "default control follows the email without an added wrapper");
            assert.ok(defaultOrder.emailBottom <= defaultOrder.controlTop, "the default control appears below the email");
            assert.ok(defaultOrder.controlBottom <= defaultOrder.disconnectTop, "the default control appears before Disconnect");
            state.setFailCalendarSave(true);
            await outlookDefault.click();
            await page
              .getByRole("alert")
              .filter({ hasText: "Calendar default save failed." })
              .waitFor();
            assert.equal(await googleDefault.isChecked(), true);
            assert.equal(await outlookDefault.isChecked(), false);
            assert.equal(profile.preferredProvider, "google");
            state.setFailCalendarSave(false);
            await outlookDefault.click();
            await page.getByRole("status").filter({ hasText: "Calendar default saved." }).waitFor();
            assert.equal(await googleDefault.isChecked(), false);
            assert.equal(await outlookDefault.isChecked(), true);
            assert.equal(profile.preferredProvider, "microsoft");
            await outlookDefault.click();
            await page.waitForFunction(
              () =>
                document
                  .querySelector('button[aria-label="Use Outlook Calendar as default calendar"]')
                  ?.getAttribute("aria-checked") === "false",
            );
            assert.equal(await googleDefault.isChecked(), false);
            assert.equal(
              profile.preferredProvider,
              null,
              "toggling the selected provider clears the saved default",
            );
            await outlookDefault.click();
            await page.waitForFunction(
              () =>
                document
                  .querySelector('button[aria-label="Use Outlook Calendar as default calendar"]')
                  ?.getAttribute("aria-checked") === "true",
            );
            const outlookRow = page
              .locator("#calendars")
              .getByRole("heading", { name: "Outlook Calendar", exact: true })
              .locator("../..");
            await outlookRow.getByRole("button", { name: "Disconnect", exact: true }).click();
            const dialog = page.getByRole("dialog");
            await dialog
              .getByRole("heading", { name: "Disconnect Outlook?", exact: true })
              .waitFor();
            await dialog.getByRole("button", { name: "Keep connected", exact: true }).click();
            assert.equal(
              writes.filter((write) => write.path === "/api/oauth/disconnect").length,
              0,
            );
            assert.equal(await outlookDefault.isChecked(), true);
            const releaseCalendarRead = state.holdNextCalendarRead();
            const pendingRead = page.waitForRequest(
              (request) => new URL(request.url()).pathname === "/api/calendars",
            );
            await page.getByRole("button", { name: "Refresh", exact: true }).click();
            await pendingRead;
            await outlookRow.getByRole("button", { name: "Disconnect", exact: true }).click();
            await dialog.getByRole("button", { name: "Disconnect", exact: true }).click();
            await dialog.waitFor({ state: "hidden" });
            const lateResponse = page.waitForResponse(
              (response) => new URL(response.url()).pathname === "/api/calendars",
            );
            releaseCalendarRead();
            await lateResponse;
            await page.evaluate(
              () =>
                new Promise((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(resolve)),
                ),
            );
            assert.equal(
              await outlookDefault.count(),
              0,
              "a late Refresh cannot restore the disconnected provider's default switch",
            );
            assert.equal(await googleDefault.isEnabled(), true);
            assert.equal(await googleDefault.isChecked(), false);
            assert.equal(
              await page
                .getByRole("button", { name: "Connect Outlook Calendar", exact: true })
                .isVisible(),
              true,
            );
            assert.equal(
              await page.getByText("calendar@settings.test", { exact: true }).isVisible(),
              true,
              "disconnecting Outlook preserves Google's verified email even during a pending Refresh",
            );
            assert.equal(profile.preferredProvider, null);
            assert.equal(
              state.calendarReads.length,
              2,
              "disconnect updates locally and discards the older Refresh response",
            );
            assert.deepEqual(
              writes
                .filter((write) => write.path === "/api/oauth/disconnect")
                .map((write) => write.body),
              [{ provider: "microsoft" }],
            );
            await assertNoOverflow(page);
            await page.screenshot({
              path: path.join(output, `calendars-${width}-${theme}.png`),
              fullPage: true,
            });
          } finally {
            await context.close();
          }
        },
      );
    }

    await t.test("Google OAuth return shares the single page-load connection check", async () => {
      const { page, context, calendarReads } = await fixture({
        href: "/settings?googleAuth=stored#calendars",
      });
      try {
        await page.getByRole("status").filter({ hasText: "Google Calendar connected." }).waitFor();
        await waitCalendarDefaultsReady(page);
        assert.equal(calendarReads.length, 1);
        assert.equal(new URL(page.url()).search, "");
      } finally {
        await context.close();
      }
    });

    await t.test(
      "switching accounts discards the previous account's staged name and photo",
      async () => {
        const state = await fixture();
        const { page, context, writes } = state;
        try {
          await openSection(page, "Profile");
          await page.waitForFunction(
            () => document.querySelector('input[autocomplete="given-name"]')?.value === "Test",
          );
          await page.getByLabel("First name", { exact: true }).fill("Private draft");
          await page
            .locator('input[type="file"]')
            .setInputFiles({ name: "private-photo.png", mimeType: "image/png", buffer: png });
          await page.waitForFunction(() =>
            [...document.images].some((image) => image.src.startsWith("blob:")),
          );
          state.setProfile({
            firstName: "Second",
            lastName: "Account",
            avatarUrl: "/avatar-second.png",
            preferredProvider: "google",
          });
          await page.evaluate(() =>
            window.settingsWorkspaceFixture.setAccount("second@settings.test", "Second Account"),
          );
          await page.waitForFunction(
            () => document.querySelector('input[autocomplete="given-name"]')?.value === "Second",
          );
          assert.equal(await page.getByLabel("Last name", { exact: true }).inputValue(), "Account");
          assert.equal(
            await page.getByRole("button", { name: "Save changes", exact: true }).isDisabled(),
            true,
          );
          assert.equal(
            await page.evaluate(() =>
              [...document.images].some((image) => image.src.startsWith("blob:")),
            ),
            false,
          );
          assert.equal(
            (await page.getByText("second@settings.test", { exact: true }).count()) > 0,
            true,
          );
          assert.equal(writes.length, 0, "switching accounts never saves another account's draft");
          assert.equal(
            state.calendarReads.length,
            2,
            "switching accounts makes one fresh connection check",
          );
        } finally {
          await context.close();
        }
      },
    );

    for (const [href, heading] of [
      ["/settings#security", "Sign-in & security"],
      ["/settings#your-sports", "Creation tools & access"],
      ["/settings#calendars", "Calendars"],
      ["/settings?section=favorites", "Favorites"],
    ]) {
      await t.test(`phone deep link ${href} opens its section`, async () => {
        const { page, context } = await fixture({ width: 375, href });
        try {
          await page
            .locator("[data-settings-detail]")
            .getByRole("heading", { name: heading, exact: true })
            .waitFor();
          assert.equal(
            await page.locator("[data-settings-canvas]").getAttribute("data-settings-view"),
            "detail",
          );
          await assertNoOverflow(page);
          await page.getByRole("button", { name: "All settings", exact: true }).click();
          assert.equal(
            await page
              .getByRole("navigation", { name: "Settings sections", exact: true })
              .isVisible(),
            true,
          );
        } finally {
          await context.close();
        }
      });
    }
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(unexpected, [], "all network boundaries remain local and explicit");
  } finally {
    await browser.close();
  }
});
