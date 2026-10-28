const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

async function assertLauncherImage(button) {
  const logo = await button.locator('img[aria-hidden="true"]').evaluate(async (node) => {
    await node.decode();
    const style = getComputedStyle(node);
    const canvas = document.createElement("canvas");
    canvas.width = node.naturalWidth;
    canvas.height = node.naturalHeight;
    const context = canvas.getContext("2d");
    context.drawImage(node, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let gold;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] === 255) {
        gold = [...pixels.slice(index, index + 3)];
        break;
      }
    }
    return {
      src: node.getAttribute("src"),
      alt: node.alt,
      loading: node.loading,
      priority: node.fetchPriority,
      crossOrigin: node.crossOrigin,
      objectFit: style.objectFit,
      mask: style.maskImage,
      width: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height,
      widthAttribute: node.getAttribute("width"),
      heightAttribute: node.getAttribute("height"),
      complete: node.complete && node.naturalWidth > 0 && node.naturalHeight > 0,
      gold,
    };
  });
  assert.deepEqual(logo, {
    src: "/brand/responsive-v1/concierge-gold-168.webp",
    alt: "", loading: "eager", priority: "high", crossOrigin: "anonymous",
    objectFit: "contain", mask: "none", width: 56, height: 56,
    widthAttribute: "56", heightAttribute: "56", complete: true, gold: [249, 223, 148],
  }, "the native launcher image decodes at the approved size and gold with matching preload mode");
  assert.deepEqual(await button.evaluate((node) => ({
    ink: getComputedStyle(node).color,
    backing: getComputedStyle(node, "::before").backgroundColor,
  })), { ink: "rgb(249, 223, 148)", backing: "rgb(36, 25, 39)" }, "Concierge retains its gold ink and plum backing");
}

test("Concierge uses an anchored popover, answers known questions instantly, and clears conversations on reset or close", {
  timeout: 120000,
}, async () => {
  const output = path.resolve("output/concierge-scroll");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.resolve("scripts/fixtures/concierge/entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
          "@/lib/guest-chat/client$": path.resolve("scripts/fixtures/concierge/client.ts"),
          "next-auth/react": path.resolve("scripts/fixtures/concierge/session.ts"),
          "next/navigation": path.resolve("scripts/fixtures/concierge/navigation.tsx"),
          "next/link": path.resolve("scripts/fixtures/concierge/navigation.tsx"),
          "@": path.resolve("src"),
        },
      },
      plugins: [
        new compiled.webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("development"),
        }),
      ],
      module: {
        rules: [
          {
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: path.resolve("scripts/lib/create-guest-ts-loader.cjs"),
          },
          { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        ],
      },
    });
    compiler.run((error, stats) =>
      compiler.close(() =>
        error || stats?.hasErrors()
          ? reject(error || new Error(stats.toString({ all: false, errors: true })))
          : resolve(),
      ),
    );
  });
  const source = fs
    .readFileSync("src/app/globals.css", "utf8")
    .replace(
      '@import "tailwindcss";',
      '@import "tailwindcss" source(none);\n@source "../components/navigation/ConciergeLauncher.tsx";\n@source "../components/navigation/ConciergeSheet.tsx";\n@source "../components/guest-chat/GuestChatWidget.tsx";',
    );
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(source, {
      from: path.resolve("src/app/globals.css"),
    })
  ).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(7000);
  const errors = [],
    unexpected = [],
    questions = [];
  const base = "http://concierge-scroll.test";
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== base) {
      unexpected.push(url.href);
      return route.abort();
    }
    if (url.pathname === "/fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname === "/api/guest-chat") {
      questions.push(route.request().postDataJSON());
      if (route.request().headers().referer?.includes("offline=1")) return route.abort();
      if (questions.at(-1).message === "Can I change that later?") {
        const events = [
          { type: "delta", text: "Start in the Live Card " },
          { type: "delta", text: "builder." },
          {
            type: "done",
            ok: true,
            answer:
              "Start in the Live Card builder.\n\nWant to try it now? Create an account to get started.",
            signupSuggested: true,
          },
        ];
        return route.fulfill({
          contentType: "application/x-ndjson",
          body: `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
        });
      }
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ ok: true, answer: "Guests can RSVP from the shared event page." }),
      });
    }
    if (url.pathname === "/logo-colored.png")
      return route.fulfill({
        contentType: "image/png",
        body: fs.readFileSync("public/logo-colored.png"),
      });
    if (url.pathname === "/brand/responsive-v1/concierge-gold-168.webp")
      return route.fulfill({
        contentType: "image/webp",
        body: fs.readFileSync("public/brand/responsive-v1/concierge-gold-168.webp"),
      });
    if (url.pathname.startsWith("/fonts/")) return route.fulfill({ status: 204 });
    if (url.pathname !== "/") {
      unexpected.push(url.href);
      return route.abort();
    }
    return route.fulfill({
      contentType: "text/html",
      body: `<html><head><meta charset="utf-8"><style>${css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`,
    });
  });
  const launcher = page.locator("[data-concierge-launcher]");
  const button = launcher.getByRole("button", {
    name: "Open Envitefy Concierge",
    exact: true,
  });
  const scroll = (top) =>
    page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
  try {
    await page.goto(base);
    await button.waitFor({ state: "visible" });
    assert.equal(await launcher.getAttribute("data-visible"), "true", "Concierge is available on the desktop hero");
    assert.equal(
      await launcher.evaluate((node) => node.inert),
      false,
      "the available launcher remains keyboard focusable",
    );
    assert.equal(await page.locator("[data-mobile-bottom-nav]").count(), 0, "the retired bottom bar is not mounted");
    const desktopPosition = await button.boundingBox();
    assert.equal(desktopPosition.width, 56, "desktop launcher uses the former circle's width");
    assert.equal(desktopPosition.height, 56);
    assert.equal(900 - desktopPosition.y - desktopPosition.height, 24, "desktop launcher clears the bottom by 1.5rem");
    await page.screenshot({ path: path.join(output, "desktop-hero-launcher.png") });
    await scroll(899);
    assert.equal(await button.isVisible(), true, "Concierge stays available while the hero leaves view");
    await scroll(901);
    assert.deepEqual(await button.boundingBox(), desktopPosition, "scrolling does not move the fixed launcher");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(questions.length, 0, "scrolling alone makes no chat request");
    assert.equal(await button.getByText("Ask Envitefy").count(), 0);
    await assertLauncherImage(button);
    assert.equal(await button.textContent(), "", "the launcher displays only the symbol");
    const buttonSurface = await button.evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.borderWidth, style.backgroundColor, style.backgroundImage, style.boxShadow];
    });
    assert.deepEqual(buttonSurface, ["0px", "rgba(0, 0, 0, 0)", "none", "none"], "the surrounding circle has no border, fill or shadow");
    await page.screenshot({ path: path.join(output, "desktop-launcher.png") });
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Envitefy Concierge" });
    await dialog.waitFor();
    await dialog.evaluate((node) => new Promise((resolve) => {
      const settled = () => getComputedStyle(node).transform === "none"
        ? resolve()
        : requestAnimationFrame(settled);
      requestAnimationFrame(settled);
    }));
    assert.equal(await dialog.locator('[aria-live="polite"]').evaluate((node) => node.scrollTop), 0, "opening starts at the complete welcome message");
    const bounds = await dialog.boundingBox();
    assert.ok(
      bounds.width <= 400 && bounds.x > 800 && bounds.y > 100,
      "desktop panel stays compact in the bottom-right",
    );
    assert.equal(await dialog.getAttribute("aria-modal"), "false");
    assert.notEqual(
      await page.evaluate(() => document.documentElement.style.overflow),
      "hidden",
      "desktop page remains scrollable",
    );
    await dialog.getByLabel("Question for Envitefy Concierge").fill("How do RSVPs work?");
    await dialog.getByRole("button", { name: "Send Envitefy Concierge message" }).click();
    const rsvpAnswer = dialog.getByText(/When RSVP is enabled, guests can respond from the live event page/);
    await rsvpAnswer.waitFor({ timeout: 1000 });
    assert.equal(questions.length, 0, "typed premade questions need no chat request");
    assert.equal(await dialog.getByText("Thinking...", { exact: true }).count(), 0);
    await dialog.getByLabel("Question for Envitefy Concierge").fill("How do I create a Live Card?");
    await dialog.getByRole("button", { name: "Send Envitefy Concierge message" }).click();
    await dialog.getByText(/In Your card, enter the event title/).waitFor({ timeout: 1000 });
    assert.equal(questions.length, 0, "common product questions also answer locally");
    await dialog.getByRole("button", { name: "Create account" }).waitFor();
    await dialog.getByLabel("Question for Envitefy Concierge").fill("Can I change that later?");
    await dialog.getByRole("button", { name: "Send Envitefy Concierge message" }).click();
    await dialog.getByText(/Start in the Live Card builder\.\s+Want to try it now\?/).waitFor();
    assert.equal(questions.length, 1, "contextual questions retain the streamed response path");
    assert.equal(questions[0].stream, true);
    assert.equal(questions[0].history.at(-1).text, "Can I change that later?");
    assert.ok(questions[0].history.some((message) => message.role === "assistant" && /When RSVP is enabled/.test(message.text)), "server followups retain local answer history");
    assert.ok(questions[0].history.every((message) => !message.text.startsWith("Hi! I'm")), "welcome copy is excluded from history");
    await page.screenshot({ path: path.join(output, "desktop-concierge.png") });
    const input = dialog.getByLabel("Question for Envitefy Concierge");
    await input.click();
    await input.fill("Keep this unsent question");
    assert.equal(await dialog.isVisible(), true, "clicks inside keep Concierge open");
    await page.mouse.click(100, 100);
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await button.isVisible(), true, "outside clicks collapse back to the launcher");
    assert.equal(questions.length, 1, "collapsing sends no message");
    await button.click();
    await dialog.waitFor();
    assert.equal(await input.inputValue(), "", "outside dismissal clears the unsent draft");
    assert.equal(await rsvpAnswer.count(), 0, "outside dismissal clears earlier answers");
    assert.equal(await dialog.getByRole("button", { name: "Create account", exact: true }).count(), 0, "outside dismissal clears signup prompts");
    assert.equal(await dialog.getByRole("button", { name: "How do RSVPs work?", exact: true }).isVisible(), true);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(
      await button.evaluate((node) => node === document.activeElement),
      true,
      "closing returns focus to the launcher",
    );
    await scroll(0);
    assert.equal(await button.isVisible(), true, "returning to the hero keeps Concierge available");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await scroll(901);
    assert.equal(await button.evaluate((node) => getComputedStyle(node).transitionDuration), "0s");
    await button.click();
    await dialog.waitFor();
    assert.equal(await dialog.evaluate((node) => getComputedStyle(node).transform), "none");
    await page.getByRole("button", { name: "Close Envitefy Concierge", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });

    await page.setViewportSize({ width: 390, height: 844 });
    await scroll(0);
    await page.waitForTimeout(80);
    assert.equal(await button.isVisible(), true, "Concierge is available on the phone hero");
    const mobilePosition = await button.boundingBox();
    assert.equal(mobilePosition.width, 56, "phone launcher has a 56px touch target");
    assert.equal(mobilePosition.height, 56);
    assert.ok(mobilePosition.x >= 0 && mobilePosition.x + mobilePosition.width <= 390);
    assert.ok(mobilePosition.y + mobilePosition.height < 844, "phone launcher clears the bottom edge");
    assert.equal(await button.getByText("Concierge", { exact: true }).isVisible(), false, "phone launcher is icon only");
    const nav = page.getByRole("navigation", { name: "Signed-out mobile navigation" });
    assert.equal(await nav.count(), 0, "the retired mobile navigation is absent");
    await page.screenshot({ path: path.join(output, "mobile-hero-launcher.png") });
    await scroll(845);
    assert.deepEqual(await button.boundingBox(), mobilePosition, "phone scrolling keeps Concierge in the same corner");
    await button.click();
    await dialog.waitFor();
    assert.equal(await dialog.getAttribute("aria-modal"), "false", "phone Concierge is a nonmodal popover");
    assert.notEqual(await page.evaluate(() => document.documentElement.style.overflow), "hidden", "phone page remains scrollable");
    assert.equal(await page.getByRole("button", { name: "Dismiss Envitefy Concierge", exact: true }).count(), 0, "phone popover has no scrim");
    assert.equal(await dialog.locator('[aria-live="polite"]').evaluate((node) => node.scrollTop), 0, "phone opening does not clip the welcome introduction");
    await page.screenshot({ path: path.join(output, "mobile-concierge.png") });
    await page.mouse.click(20, 20);
    await dialog.waitFor({ state: "hidden" });
    assert.notEqual(await page.evaluate(() => document.documentElement.style.overflow), "hidden");
    await button.click();
    await dialog.waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await button.isVisible(), true, "phone dismissal leaves the launcher available");
    assert.equal(questions.length, 1, "opening and dismissing Concierge never sends a message");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/?noHero`);
    await page.waitForFunction(
      () => document.querySelector("[data-concierge-launcher]")?.dataset.visible === "true",
    );
    const starterCases = [
      ["What can I make with Envitefy?", /Envitefy helps hosts create Live Cards/],
      ["Should I use a Live Card, an Event Page, or a Sign-up Form?", /Choose a Live Card for a striking invitation/],
      ["Do my guests need an app or account?", /No\. Guests can open a shared Envitefy event page/],
      ["Can I turn a flyer or invite photo into an event?", /SNAP is the upload path/],
      ["How do RSVPs work?", /When RSVP is enabled, guests can respond/],
    ];
    const localTimes = [];
    const networkCount = questions.length;
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const [question, answer] of starterCases) {
        await page.goto(`${base}/?noHero&offline=1`);
        await button.click();
        await dialog.waitFor();
        await dialog.evaluate((node) => {
          window.conciergeShowedThinking = false;
          new MutationObserver((records) => {
            if (records.some((record) => Array.from(record.addedNodes).some((added) => added.textContent?.includes("Thinking...")))) {
              window.conciergeShowedThinking = true;
            }
          }).observe(node, { childList: true, subtree: true });
        });
        const started = performance.now();
        await dialog.getByRole("button", { name: question, exact: true }).click();
        await dialog.getByText(answer).waitFor({ timeout: 1000 });
        localTimes.push(Math.round(performance.now() - started));
        assert.equal(questions.length, networkCount, `${question} answers with the API unavailable at ${viewport.width}px`);
        assert.equal(await page.evaluate(() => window.conciergeShowedThinking), false, `${question} never shows Thinking`);
        assert.equal(await dialog.getByLabel("Question for Envitefy Concierge").isEnabled(), true);
      }
    }
    console.log(`All five starters answered without a request on desktop and phone; slowest click-to-answer check ${Math.max(...localTimes)}ms.`);

    const reset = (panel) => panel.getByRole("button", { name: "New conversation", exact: true });
    const composer = (panel) => panel.getByPlaceholder("Ask about Envitefy...", { exact: true });
    const send = async (panel, message) => {
      await composer(panel).fill(message);
      await panel.getByRole("button", { name: "Send Envitefy Concierge message", exact: true }).click();
    };
    const fresh = async (panel) => {
      await panel.getByRole("button", { name: starterCases[0][0], exact: true }).waitFor();
      for (const [question] of starterCases) {
        assert.equal(await panel.getByRole("button", { name: question, exact: true }).count(), 1);
      }
      assert.equal(await composer(panel).inputValue(), "", "a fresh conversation has no unsent draft");
      assert.equal(await panel.locator('[aria-live="polite"]').first().evaluate((node) => node.scrollTop), 0, "fresh conversation starts at its complete welcome message");
      assert.equal(await composer(panel).isEnabled(), true, "a fresh conversation is ready to type");
      assert.equal(await panel.getByText(/Thinking\.\.\.|Answering\.\.\./).count(), 0);
      assert.equal(await panel.getByRole("button", { name: "Create account", exact: true }).count(), 0);
      assert.equal(await reset(panel).count(), 0, "reset control is hidden for the welcome-only conversation");
    };
    const populate = async (panel) => {
      await send(panel, "How do I create a Live Card?");
      await panel.getByText(/In Your card, enter the event title/).waitFor();
      await composer(panel).fill("Unsent text from the previous conversation");
    };
    const panelFor = (widget) => widget
      ? page.locator('section[aria-label="Envitefy Concierge chat"]')
      : page.getByRole("dialog", { name: "Envitefy Concierge", exact: true });
    const openPanel = async (panel) => {
      await page.getByRole("button", { name: "Open Envitefy Concierge", exact: true }).click();
      await panel.waitFor();
    };
    const dismiss = async (panel, method, widget = false) => {
      if (method === "escape") await page.keyboard.press("Escape");
      else if (method === "outside") await page.mouse.click(4, 4);
      else if (method === "parent") await page.evaluate(() => window.dispatchEvent(new Event("concierge-fixture-close")));
      else if (method === "launcher") await page.getByRole("button", { name: widget ? "Close Envitefy Concierge" : "Minimize Envitefy Concierge", exact: true }).click();
      else await panel.getByRole("button", { name: widget ? "Close Envitefy Concierge chat" : "Close Envitefy Concierge", exact: true }).click();
      await panel.waitFor({ state: "hidden" });
    };

    // Every sheet dismissal route resets completed replies, signup prompts and unsent text.
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/?noHero`);
      const panel = panelFor(false);
      await openPanel(panel);
      for (const method of ["close", "escape", "outside", "parent", "launcher"]) {
        await populate(panel);
        await dismiss(panel, method);
        await openPanel(panel);
        await fresh(panel);
        assert.equal(await panel.getByText("Unsent text from the previous conversation", { exact: true }).count(), 0);
        assert.equal(await panel.getByText(/In Your card, enter the event title/).count(), 0, `${method} clears the transcript at ${viewport.width}px`);
      }
    }

    // Deferred fixture requests intentionally ignore abort. UI generation guards must
    // reject their late stream/finally callbacks without altering a newer request.
    for (const widget of [false, true]) {
      for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`${base}/?noHero&controlled=1${widget ? "&widget=1" : ""}`);
        const panel = panelFor(widget);
        await openPanel(panel);
        await populate(panel);
        if (!widget) await page.screenshot({ path: path.join(output, `${viewport.width > 768 ? "desktop" : "mobile"}-new-conversation.png`) });
        const resetBounds = await reset(panel).boundingBox();
        assert.ok(resetBounds.width >= 44 && resetBounds.height >= 44, "New conversation keeps a 44px target");
        await reset(panel).focus();
        await page.keyboard.press("Enter");
        await fresh(panel);
        assert.equal(await panel.isVisible(), true, "New conversation keeps Concierge open");
        assert.equal(await panel.getByRole("button", { name: starterCases[0][0], exact: true }).evaluate((node) => node === document.activeElement), true, "keyboard reset focuses the first starter");

        const firstMessage = "Does Envitefy provide custom webhook delivery?";
        const nextMessage = "Can Envitefy publish a custom webhook?";
        await send(panel, firstMessage);
        await page.waitForFunction(() => window.conciergeControlledRequests?.length === 1);
        assert.equal(await composer(panel).isDisabled(), true);
        await page.evaluate(() => window.conciergeControlledRequests[0].delta("Previous partial answer"));
        await panel.getByText("Previous partial answer", { exact: true }).waitFor();
        await reset(panel).click();
        await fresh(panel);
        assert.equal(await page.evaluate(() => window.conciergeControlledRequests[0].signal.aborted), true, "reset aborts pending transport");
        await send(panel, nextMessage);
        await page.waitForFunction(() => window.conciergeControlledRequests?.length === 2);
        const nextHistory = await page.evaluate(() => window.conciergeControlledRequests[1].history);
        assert.deepEqual(nextHistory, [{ role: "user", text: nextMessage }], "the next request excludes the previous conversation");
        await page.evaluate(() => {
          window.conciergeControlledRequests[0].delta("Stale delta after reset");
          window.conciergeControlledRequests[0].resolve({ answer: "Late previous answer", signupSuggested: true, handoffSuggested: true });
        });
        await page.waitForTimeout(50);
        assert.equal(await composer(panel).isDisabled(), true, "old completion cannot unlock a new pending request");
        assert.equal(await panel.getByText(/Previous partial answer|Stale delta after reset|Late previous answer/).count(), 0, "old replies cannot repopulate the reset conversation");
        await page.evaluate(() => window.conciergeControlledRequests[1].resolve({ answer: "Current request completed." }));
        await panel.getByText("Current request completed.", { exact: true }).waitFor();
        assert.equal(await composer(panel).isEnabled(), true);

        await reset(panel).click();
        await send(panel, firstMessage);
        await page.waitForFunction(() => window.conciergeControlledRequests?.length === 3);
        await dismiss(panel, "launcher", widget);
        assert.equal(await page.evaluate(() => window.conciergeControlledRequests[2].signal.aborted), true, "minimizing through the launcher aborts pending transport");
        await openPanel(panel);
        await fresh(panel);
        await send(panel, nextMessage);
        await page.waitForFunction(() => window.conciergeControlledRequests?.length === 4);
        await page.evaluate(() => {
          window.conciergeControlledRequests[2].delta("Stale delta after close");
          window.conciergeControlledRequests[2].resolve({ answer: "Late closed conversation answer", signupSuggested: true, handoffSuggested: true });
        });
        await page.waitForTimeout(50);
        assert.equal(await composer(panel).isDisabled(), true, "closed conversation cannot clear the new request's pending state");
        assert.equal(await panel.getByText(/Stale delta after close|Late closed conversation answer/).count(), 0);
        await page.evaluate(() => window.conciergeControlledRequests[3].resolve({ answer: "Reopened request completed." }));
        await panel.getByText("Reopened request completed.", { exact: true }).waitFor();

        if (widget) {
          await reset(panel).click();
          await send(panel, "How do I contact Envitefy support?");
          await panel.getByRole("button", { name: "Contact support", exact: true }).click();
          await panel.getByPlaceholder("Name", { exact: true }).fill("Previous visitor");
          await panel.getByPlaceholder("Email", { exact: true }).fill("previous@example.test");
          await panel.getByPlaceholder("What should we follow up on?", { exact: true }).fill("Previous support note");
          await reset(panel).click();
          await fresh(panel);
          assert.equal(await panel.getByPlaceholder("Email", { exact: true }).count(), 0, "reset hides the contact form");
          await send(panel, "How do I contact Envitefy support?");
          await panel.getByRole("button", { name: "Contact support", exact: true }).click();
          for (const placeholder of ["Name", "Email", "What should we follow up on?"]) {
            assert.equal(await panel.getByPlaceholder(placeholder, { exact: true }).inputValue(), "", "reset removes the previous visitor's contact fields");
          }
          await dismiss(panel, "close", true);
          await openPanel(panel);
          await fresh(panel);
        }
      }
    }
    assert.equal(questions.length, networkCount, "reset and dismissal checks only use local answers or controlled fixture requests");

    // The same real e button toggles both ways. In particular its pointerdown
    // must not trigger the desktop outside-close handler before click reopens it.
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.setViewportSize(viewport);
      await page.goto(`${base}/?noHero`);
      const panel = panelFor(false);
      const toggle = page.locator("[data-concierge-launcher] button");
      await toggle.waitFor();
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.equal(await toggle.getAttribute("aria-label"), "Open Envitefy Concierge");
      await toggle.click();
      await panel.waitFor();
      assert.equal(await toggle.getAttribute("aria-expanded"), "true");
      assert.equal(await toggle.getAttribute("aria-label"), "Minimize Envitefy Concierge");
      assert.equal(await page.locator("[data-concierge-launcher]").getAttribute("data-open"), "true");
      await populate(panel);
      if (viewport.width < 768) {
        const iconBounds = await toggle.boundingBox();
        const composerBounds = await panel.locator("form").last().boundingBox();
        assert.ok(composerBounds.y + composerBounds.height <= iconBounds.y, "the exposed phone launcher clears the entire composer and Send button");
      }
      assert.equal(await toggle.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest("button") === node;
      }), true, "the e launcher remains clickable beside the open popover");
      await toggle.click();
      await panel.waitFor({ state: "hidden" });
      await page.waitForTimeout(280);
      assert.equal(await panel.count(), 0, "second pointer click stays minimized after the exit animation");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.equal(await toggle.getAttribute("aria-label"), "Open Envitefy Concierge");
      assert.equal(await page.locator("[data-concierge-launcher]").getAttribute("data-open"), "false");
      await toggle.click();
      await panel.waitFor();
      await fresh(panel);
      await toggle.click();
      await panel.waitFor({ state: "hidden" });
      for (const key of ["Enter", "Space"]) {
        await toggle.focus();
        await page.keyboard.press(key);
        await panel.waitFor();
        assert.equal(await toggle.getAttribute("aria-expanded"), "true", `${key} opens the chat`);
        await toggle.focus();
        await page.keyboard.press(key);
        await panel.waitFor({ state: "hidden" });
        await page.waitForTimeout(250);
        assert.equal(await panel.count(), 0, `${key} minimizes without reopening`);
        assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      }
    }

    // Support pages opt into the same e launcher without replacing their
    // contact-capable guest chat. New public headers share the regular sheet.
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const variant of ["widget&conciergeLauncher", "publicConcierge"]) {
        await page.goto(`${base}/?noHero&offline=1&${variant}`);
        const panel = panelFor(variant.startsWith("widget"));
        const toggle = page.locator("[data-concierge-launcher] button");
        await toggle.waitFor();
        assert.equal(await page.locator("[data-concierge-launcher]").count(), 1, "each public page has one shared launcher");
        assert.equal((await toggle.boundingBox()).width, 56);
        await assertLauncherImage(toggle);
        await toggle.click();
        await panel.waitFor();
        assert.equal(await toggle.getAttribute("aria-label"), "Minimize Envitefy Concierge");
        await populate(panel);
        await toggle.click();
        await panel.waitFor({ state: "hidden" });
        await page.waitForTimeout(280);
        assert.equal(await panel.count(), 0, "the e launcher minimizes without reopening on its click");
        await toggle.click();
        await panel.waitFor();
        await fresh(panel);
        await page.keyboard.press("Escape");
        await panel.waitFor({ state: "hidden" });
        assert.equal(await toggle.evaluate((node) => node === document.activeElement), true, "Escape returns focus to the shared support launcher");
      }
    }
    for (const session of ["loading", "authenticated"]) {
      await page.goto(`${base}/?noHero&publicConcierge&session=${session}`);
      await page.getByRole("heading", { name: "Event templates", exact: true }).waitFor();
      assert.equal(await page.locator("[data-concierge-launcher]").count(), 0, "public help does not mount in a signed-in workspace or while session identity resolves");
      assert.equal(await page.getByRole("dialog").count(), 0);
    }

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, bottom: 28, right: 35 } });
    const launchButton = () => page.getByRole("button", { name: "Open Envitefy Concierge", exact: true });
    const startMotionProbe = async (widget) => page.evaluate((isWidget) => {
      const selector = isWidget ? 'section[aria-label="Envitefy Concierge chat"]' : '[role="dialog"][aria-label="Envitefy Concierge"]';
      const probe = { frames: [], done: false };
      window.conciergeMotionProbe = probe;
      let first;
      const sample = (now) => {
        if (window.conciergeMotionProbe !== probe) return;
        const panel = document.querySelector(selector);
        if (panel) {
          first ??= now;
          const rect = panel.getBoundingClientRect();
          const style = getComputedStyle(panel);
          const matrix = new DOMMatrixReadOnly(style.transform);
          probe.frames.push({
            elapsed: now - first,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            scaleX: Math.hypot(matrix.a, matrix.b),
            scaleY: Math.hypot(matrix.c, matrix.d),
            translateY: matrix.m42,
            transform: style.transform,
            arrowX: style.getPropertyValue("--concierge-arrow-x"),
            opacity: Number(style.opacity),
            filter: style.filter,
            motion: panel.dataset.conciergeMotion,
            overflow: document.documentElement.scrollWidth > innerWidth,
          });
          if (now - first >= 500) {
            probe.done = true;
            return;
          }
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }, widget);
    const settled = async (panel) => {
      await panel.evaluate((node) => new Promise((resolve) => {
        const frame = () => getComputedStyle(node).transform === "none" && getComputedStyle(node).opacity === "1"
          ? resolve()
          : requestAnimationFrame(frame);
        requestAnimationFrame(frame);
      }));
    };
    const assertPlacement = async (panel) => {
      const measured = await panel.evaluate((node) => {
        const launcher = document.querySelector('[data-concierge-launcher] button, button[aria-label="Open Envitefy Concierge"], button[aria-label="Minimize Envitefy Concierge"], button[aria-label="Close Envitefy Concierge"]');
        const buttonRect = launcher.getBoundingClientRect();
        const panelRect = node.getBoundingClientRect();
        const arrow = node.querySelector("[data-concierge-arrow]");
        const arrowRect = arrow?.getBoundingClientRect();
        return {
          x: panelRect.x,
          y: panelRect.y,
          width: panelRect.width,
          height: panelRect.height,
          right: panelRect.right,
          bottom: panelRect.bottom,
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
          side: node.dataset.conciergeSide,
          anchorTop: buttonRect.y,
          anchorBottom: buttonRect.bottom,
          expectedArrowX: Math.max(panelRect.x + 24, Math.min(panelRect.right - 24, buttonRect.x + buttonRect.width / 2)),
          arrowX: arrowRect ? arrowRect.x + arrowRect.width / 2 : null,
          arrowY: arrowRect ? arrowRect.y + arrowRect.height / 2 : null,
          ariaModal: node.getAttribute("aria-modal"),
          htmlOverflow: document.documentElement.style.overflow,
          bodyOverflow: document.body.style.overflow,
          scrimCount: document.querySelectorAll('[aria-label="Dismiss Envitefy Concierge"]').length,
        };
      });
      assert.ok(measured.x >= 15.5 && measured.right <= measured.viewportWidth - 15.5, `popover keeps viewport side gutters: ${JSON.stringify(measured)}`);
      assert.ok(measured.y >= 15.5 && measured.bottom <= measured.viewportHeight - 15.5);
      assert.ok(measured.width <= 384.5 && measured.height <= 544.5, "popover retains compact width and height");
      if (measured.side === "bottom") assert.ok(measured.y >= measured.anchorBottom + 4, "popover flips below a launcher near the viewport top");
      else assert.ok(measured.bottom <= measured.anchorTop - 4, "popover sits above the launcher with a visible gap");
      assert.notEqual(measured.arrowX, null, "popover includes its decorative bottom pointer");
      assert.ok(Math.abs(measured.arrowX - measured.expectedArrowX) < 1.5, `pointer stays anchored to the trigger center: ${JSON.stringify(measured)}`);
      if (measured.side === "bottom") assert.ok(measured.arrowY <= measured.y + 4 && measured.arrowY >= measured.anchorBottom, "flipped pointer connects the popover's top edge toward the launcher");
      else assert.ok(measured.arrowY >= measured.bottom - 4 && measured.arrowY <= measured.anchorTop, "pointer connects the popover's bottom edge toward the launcher");
      assert.notEqual(measured.ariaModal, "true");
      assert.notEqual(measured.htmlOverflow, "hidden");
      assert.notEqual(measured.bodyOverflow, "hidden");
      assert.equal(measured.scrimCount, 0, "popover has no page scrim");
    };

    for (const widget of [false, true]) {
      for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.setViewportSize(viewport);
        await page.goto(`${base}/?noHero${widget ? "&widget=1" : ""}`);
        const panel = panelFor(widget);
        const anchor = await launchButton().boundingBox();
        if (viewport.width < 768) {
          assert.equal(viewport.height - anchor.y - anchor.height, 44, "the opening uses the launcher after its 28px safe-area clearance");
        }
        await launchButton().focus();
        await startMotionProbe(widget);
        if (viewport.width > 768) await launchButton().click();
        else await page.keyboard.press("Enter");
        await panel.waitFor();
        await page.waitForFunction(() => window.conciergeMotionProbe.frames.some((frame) => frame.elapsed > 32), null, { polling: "raf" });
        await page.screenshot({ path: path.join(output, `${widget ? "widget" : "sheet"}-${viewport.width > 768 ? "desktop" : "mobile"}-popover-opening.png`) });
        await page.waitForFunction(() => window.conciergeMotionProbe.done, null, { polling: "raf" });
        const frames = await page.evaluate(() => window.conciergeMotionProbe.frames);
        const final = frames.at(-1);
        const first = frames.find((frame) => frame.opacity > 0.03);
        assert.equal(final.motion, "popover");
        assert.equal(final.transform, "none", "the completed opening leaves no transform");
        assert.equal(final.filter, "none", "the completed opening leaves no blur or filter");
        assert.ok(first.rect.width >= final.rect.width * 0.94, "popover starts close to its final size");
        assert.ok(frames.some((frame) => frame.opacity > 0.03 && frame.translateY > 0.05), "popover above the trigger emerges upward from a positive vertical offset");
        assert.ok(frames.every((frame) => frame.scaleX >= 0.94 && frame.scaleX <= 1.03 && Math.abs(frame.scaleX - frame.scaleY) < 0.003), "entrance uses a subtle uniform scale without a stretched phase");
        assert.ok(Math.abs(first.rect.x - final.rect.x) < 24 && Math.abs(first.rect.y - final.rect.y) < 40, "entrance stays beside its final anchored position");
        assert.ok(frames.every((frame) => !frame.overflow), "no animation frame creates horizontal page overflow");
        assert.ok(final.rect.x >= 0 && final.rect.x + final.rect.width <= viewport.width + 1);
        assert.ok(first.arrowX, "the pointer position is measured before the visible entrance");
        await assertPlacement(panel);
        await page.screenshot({ path: path.join(output, `${widget ? "widget" : "sheet"}-${viewport.width > 768 ? "desktop" : "mobile"}-popover.png`) });

        await populate(panel);
        const transcript = panel.locator('[aria-live="polite"]').first();
        assert.equal(await transcript.evaluate((node) => ["auto", "scroll"].includes(getComputedStyle(node).overflowY)), true, "transcript scrolls inside the compact popover");
        await page.waitForTimeout(300);
        await transcript.evaluate((node) => { node.scrollTop = 0; });
        const pageScroll = await page.evaluate(() => window.scrollY);
        await transcript.hover();
        await page.mouse.wheel(0, 120);
        await page.waitForTimeout(80);
        assert.ok(await transcript.evaluate((node) => node.scrollTop > 0), "wheel input scrolls the transcript");
        assert.equal(await page.evaluate(() => window.scrollY), pageScroll, "transcript scrolling leaves the outer page in place");
        await page.mouse.move(20, 20);
        await page.mouse.wheel(0, 160);
        await page.waitForTimeout(80);
        assert.ok(await page.evaluate((before) => window.scrollY > before, pageScroll), "the surrounding page remains natively scrollable while Concierge is open");
        assert.equal(await panel.isVisible(), true);

        await page.setViewportSize({ width: viewport.width + 40, height: viewport.height + 60 });
        await page.waitForTimeout(60);
        await settled(panel);
        await assertPlacement(panel);
        await dismiss(panel, "outside", widget);
        await openPanel(panel);
        await fresh(panel);
        await settled(panel);
        await assertPlacement(panel);
        await dismiss(panel, "close", widget);

        // A live accessibility preference change immediately settles the current entrance.
        await startMotionProbe(widget);
        await launchButton().focus();
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => window.conciergeMotionProbe.frames.some((frame) => frame.opacity > 0.03 && frame.scaleX < 0.995), null, { polling: "raf" });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await settled(panel);
        assert.equal(await panel.getAttribute("data-concierge-motion"), "reduced");
        assert.equal(await panel.evaluate((node) => node.getAnimations().filter((animation) => animation.playState === "running" || animation.playState === "pending").length), 0, "live reduced motion leaves no active panel effect");
        await assertPlacement(panel);
        await dismiss(panel, "close", widget);

        // Reduced motion starts at the complete size without a hidden or scaled frame.
        await startMotionProbe(widget);
        await launchButton().focus();
        await page.keyboard.press("Enter");
        await panel.waitFor();
        await page.waitForFunction(() => window.conciergeMotionProbe.done, null, { polling: "raf" });
        const reducedFrames = await page.evaluate(() => window.conciergeMotionProbe.frames);
        assert.ok(reducedFrames.every((frame) => frame.transform === "none" && frame.opacity === 1 && frame.motion === "reduced"), "reduced-motion opening is complete and static on every sampled frame");
        await dismiss(panel, "close", widget);

        // Keyboard users can close during the small entrance and reopen before exit finishes.
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await startMotionProbe(widget);
        await launchButton().focus();
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => window.conciergeMotionProbe.frames.some((frame) => frame.opacity > 0.03 && frame.scaleX < 0.995), null, { polling: "raf" });
        await panel.getByRole("button", { name: widget ? "Close Envitefy Concierge chat" : "Close Envitefy Concierge", exact: true }).focus();
        await page.keyboard.press("Enter");
        await launchButton().focus();
        await page.keyboard.press("Enter");
        await panel.waitFor();
        await settled(panel);
        await fresh(panel);
        assert.equal(await panel.count(), 1, "quick close/reopen leaves exactly one complete chat");
        await assertPlacement(panel);
        await dismiss(panel, "close", widget);
      }
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const widget of [false, true]) {
      for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`${base}/?noHero${widget ? "&widget=1" : ""}`);
        const panel = panelFor(widget);
        await openPanel(panel);
        await settled(panel);
        await assertPlacement(panel);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "compact or landscape popovers keep the page within its viewport");
        await dismiss(panel, "outside", widget);
      }
    }
    // Opening focus enters the nonmodal chat; Close/Escape return to its launcher,
    // while pointer and keyboard focus departures preserve the outside control.
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const widget of [false, true]) {
      for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`${base}/?noHero${widget ? "&widget=1" : ""}`);
        const panel = panelFor(widget);
        const outside = page.getByRole("button", { name: "Outside page control", exact: true });
        await page.evaluate(() => {
          window.conciergeScrollCalls = [];
          const nativeScrollTo = Element.prototype.scrollTo;
          Element.prototype.scrollTo = function (...args) {
            if (this.matches('[aria-live="polite"]')) {
              window.conciergeScrollCalls.push(typeof args[0] === "object" ? args[0] : { top: args[1] });
            }
            return nativeScrollTo.apply(this, args);
          };
        });
        const keyboardOpen = async () => {
          await launchButton().focus();
          await page.keyboard.press("Enter");
          await panel.waitFor();
          await page.waitForFunction((label) => {
            const popup = document.querySelector(`section[aria-label="${label}"]`);
            return popup?.contains(document.activeElement);
          }, widget ? "Envitefy Concierge chat" : "Envitefy Concierge", { polling: "raf" });
          const closeBounds = await panel.getByRole("button", { name: widget ? "Close Envitefy Concierge chat" : "Close Envitefy Concierge", exact: true }).boundingBox();
          assert.ok(closeBounds.width >= 44 && closeBounds.height >= 44, "chat Close keeps a 44px keyboard and touch target");
        };
        await keyboardOpen();
        if (widget || viewport.width < 768) {
          assert.equal(await composer(panel).evaluate((node) => node === document.activeElement), false, "opening does not focus the phone or widget text field");
        }
        await page.keyboard.press("Escape");
        await panel.waitFor({ state: "hidden" });
        assert.equal(await launchButton().evaluate((node) => node === document.activeElement), true, "Escape restores launcher focus");

        await keyboardOpen();
        await panel.getByRole("button", { name: widget ? "Close Envitefy Concierge chat" : "Close Envitefy Concierge", exact: true }).focus();
        await page.keyboard.press("Enter");
        await panel.waitFor({ state: "hidden" });
        assert.equal(await launchButton().evaluate((node) => node === document.activeElement), true, "keyboard Close restores launcher focus");

        await keyboardOpen();
        await panel.getByRole("button", { name: widget ? "Close Envitefy Concierge chat" : "Close Envitefy Concierge", exact: true }).focus();
        for (let step = 0; step < 3; step += 1) {
          await page.keyboard.press("Shift+Tab");
          await page.waitForTimeout(20);
          if (await outside.evaluate((node) => node === document.activeElement)) break;
        }
        await panel.waitFor({ state: "hidden" });
        assert.equal(await outside.evaluate((node) => node === document.activeElement), true, "leaving by keyboard preserves the outside focus destination");

        await keyboardOpen();
        const openToggle = widget
          ? page.getByRole("button", { name: "Close Envitefy Concierge", exact: true })
          : page.locator("[data-concierge-launcher] button");
        await openToggle.focus();
        await page.keyboard.press(widget ? "Tab" : "Shift+Tab");
        await panel.waitFor({ state: "hidden" });
        const afterLauncher = widget
          ? page.getByRole("button", { name: "Following page control", exact: true })
          : outside;
        assert.equal(await afterLauncher.evaluate((node) => node === document.activeElement), true, "keyboard departure through the excluded launcher still dismisses and preserves destination focus");

        await keyboardOpen();
        await outside.click();
        await panel.waitFor({ state: "hidden" });
        assert.equal(await outside.evaluate((node) => node === document.activeElement), true, "outside pointer dismissal preserves the clicked control's focus");

        await keyboardOpen();
        await populate(panel);
        await reset(panel).click();
        await fresh(panel);
        const scrollCalls = await page.evaluate(() => window.conciergeScrollCalls);
        assert.ok(scrollCalls.length > 0);
        assert.ok(scrollCalls.every((call) => call.behavior === "instant"), "welcome, replies and reset avoid smooth scrolling under reduced motion");
        await dismiss(panel, "close", widget);
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/?noHero`);
    await page.locator("[data-concierge-launcher]").evaluate((node) => {
      Object.assign(node.style, { left: "0px", right: "auto", top: "24px", bottom: "auto" });
    });
    const flipped = panelFor(false);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await startMotionProbe(false);
    await openPanel(flipped);
    await settled(flipped);
    await page.waitForFunction(() => window.conciergeMotionProbe.done, null, { polling: "raf" });
    assert.ok(await page.evaluate(() => window.conciergeMotionProbe.frames.some((frame) => frame.opacity > 0.03 && frame.translateY < -0.05)), "popover below the trigger emerges downward from a negative vertical offset");
    assert.equal(await flipped.getAttribute("data-concierge-side"), "bottom");
    await assertPlacement(flipped);
    assert.equal(await flipped.evaluate((node) => getComputedStyle(node).getPropertyValue("--concierge-arrow-x").trim()), "24px", "pointer clamps away from the rounded corner when the trigger is at a viewport edge");
    await startMotionProbe(false);
    await dismiss(flipped, "close");
    assert.ok(await page.evaluate(() => window.conciergeMotionProbe.frames.some((frame) => frame.opacity < 0.99 && frame.translateY < -0.05)), "flipped popover retreats toward its top-edge trigger on exit");
    await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: {} });
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
  } finally {
    await browser.close();
  }
});
