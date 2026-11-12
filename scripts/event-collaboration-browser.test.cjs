const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");
const { chromium } = require("playwright");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const { buildAppearanceBootstrap } = loadTs("src/lib/appearance.ts");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("co-host entry matches the owner event canvas; access and signup/login retain explicit acceptance", { timeout: 120000 }, async () => {
  const output = path.resolve("output/event-collaboration-browser"); fs.mkdirSync(output, { recursive: true });
  const authMock = path.join(output, "auth.ts");
  fs.writeFileSync(authMock, `export function useSession(){return {data:{user:{email:sessionStorage.getItem('qa:email')}},status:'authenticated'};} export async function signIn(_provider, options) {sessionStorage.setItem('qa:email',options.email);return {ok:true};} export async function signOut(options) {sessionStorage.removeItem('qa:email');if(options.redirect!==false)location.assign(options.callbackUrl);}`);
  const sidebarMock = path.join(output, "sidebar.ts"); fs.writeFileSync(sidebarMock, "export function useSidebar(){return {setIsCollapsed(){},clearEventContext(){window.dispatchEvent(new Event('qa:context-cleared'))}}}");
  const recaptchaMock = path.join(output, "recaptcha.ts"); fs.writeFileSync(recaptchaMock, "export function useRecaptcha(){return {executeRecaptcha:async()=> 'qa-token',loading:false}};");
  const navigationMock = path.join(output, "navigation.ts");
  fs.writeFileSync(navigationMock, "export const useRouter=()=>({push:href=>location.assign(href),replace:href=>location.replace(href),refresh(){}}); export const usePathname=()=>location.pathname;");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({ mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/event-collaboration/entry.tsx"), output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "next-auth/react": authMock, "next/navigation": navigationMock, "@/app/sidebar-context": sidebarMock, "@/hooks/useRecaptcha": recaptchaMock, "@": path.resolve("src") } },
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }, { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") }, { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" }] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/EventAccessDialog.tsx";\n@source "../components/EventLeaveCoHostDialog.tsx";\n@source "../components/EventOwnerView.tsx";\n@source "../components/EventPreviewViewport.tsx";\n@source "../components/EventPreviewActions.tsx";\n@source "../components/EventCanvas.tsx";\n@source "./cohost-invite/CoHostInvitation.tsx";\n@source "../components/auth/*.tsx";\n@source "../../scripts/fixtures/event-collaboration/entry.tsx";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js") { res.setHeader("Content-Type", "text/javascript"); res.end(script); }
    else if (req.url.startsWith("/fonts/")) {
      const font = path.resolve("public", `.${new URL(req.url, "http://fixture.test").pathname}`);
      if (!font.startsWith(path.resolve("public/fonts") + path.sep) || !fs.existsSync(font)) { res.statusCode = 404; return res.end(); }
      res.setHeader("Content-Type", font.endsWith(".woff2") ? "font/woff2" : font.endsWith(".woff") ? "font/woff" : "font/ttf");
      res.end(fs.readFileSync(font));
    }
    else if (new URL(req.url, "http://fixture.test").searchParams.get("preview") === "owner") {
      res.setHeader("Content-Type", "text/html");
      res.end('<html><body style="background:#f5fafc;color:#142631"><h1>Atlanta Centennial Classic</h1><p>Jan 29–31, 2027</p><p>Georgia International Convention Center</p></body></html>');
    }
    else { res.setHeader("Content-Type", "text/html"); res.end(`<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body style="background:var(--background)"><script>${buildAppearanceBootstrap()}</script><main id="root"></main><script src="/fixture.js"></script></body></html>`); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }).catch(async error => { await new Promise(resolve => server.close(resolve)); throw error; });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; const actions = []; const token = "a".repeat(64); let people = []; let available = true;
  let holdReads = true; const heldReads = []; const readReplies = [];
  let isSignupForm = false;
  let acceptedByCurrentUser = false;
  let inspectError = false;
  let inspectionGate = null;
  let leaveFails = false;
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.pathname === "/api/events/qa-event/collaborators") {
      if (request.method() === "DELETE" && url.searchParams.get("action") === "leave") {
        actions.push({ action: "leave", personId: url.searchParams.get("personId") });
        return route.fulfill({ status: leaveFails ? 503 : 200, json: leaveFails ? { error: "Please retry leaving this event." } : { ok: true } });
      }
      if (request.method() === "GET" && holdReads) {
        const snapshot = structuredClone(people);
        const reply = new Promise(resolve => heldReads.push(resolve)).then(() => route.fulfill({ contentType: "application/json", body: JSON.stringify({ people: snapshot }) }).catch(() => {}));
        readReplies.push(reply);
        return reply;
      }
      if (request.method() === "POST") { const input = request.postDataJSON(); actions.push(input); people = [{ id: "pending", email: input.email, name: "", status: "pending", emailStatus: "sent", expiresAt: new Date(Date.now()+86400000).toISOString() }]; }
      if (request.method() === "DELETE") { actions.push({ removed: url.searchParams.get("personId") }); people = []; }
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ people, emailSent: true }) });
    }
    if (url.pathname === "/api/cohost-invitations") {
      const input = request.postDataJSON(); actions.push(input); assert.equal(input.token, token);
      if (input.action === "accept") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ eventId: "qa-event", href: isSignupForm ? "/smart-signup-form/qa-signup#signup-host-dashboard" : "/event/qa-event?tab=event" }) });
      if (inspectionGate) await inspectionGate;
      if (inspectError) return route.fulfill({ status: 500, json: { error: "The invitation could not be loaded." } });
      const signedInEmail = await page.evaluate(() => sessionStorage.getItem("qa:email"));
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ title: "Garden party", isSignupForm, ownerName: "Taylor", email: "friend@test.com", available, accepted: acceptedByCurrentUser, acceptedByCurrentUser, href: acceptedByCurrentUser ? "/event/qa-event?tab=event" : null, signedInEmail }) });
    }
    if (url.pathname.startsWith("/api/auth/") || url.pathname.startsWith("/api/legal/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (request.url().startsWith(base)) return route.continue();
    return route.abort();
  });
  async function openEventActions() {
    const trigger = page.getByRole("button", { name: "More event actions", exact: true });
    if (await trigger.isVisible()) await trigger.click();
  }
  async function assertInvitationAppearance(state) {
    for (const appearance of ["light", "dark"]) {
      await page.evaluate(value => localStorage.setItem("envitefy:appearance:v1", value), appearance);
      await page.evaluate(buildAppearanceBootstrap());
      for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        const failures = await page.locator("main section").first().evaluate(panel => {
          const context = document.createElement("canvas").getContext("2d");
          const rgba = value => { context.clearRect(0, 0, 1, 1); context.fillStyle = value; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data]; };
          const blend = (top, bottom) => top.slice(0, 3).map((value, index) => value * top[3] / 255 + bottom[index] * (1 - top[3] / 255));
          const lum = color => color.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
          const failures = [];
          for (const element of panel.querySelectorAll("*")) {
            const text = [...element.childNodes].filter(node => node.nodeType === 3).map(node => node.textContent).join("").trim();
            if (!text || !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || element.closest("[disabled]")) continue;
            const parents = [];
            for (let node = element; node; node = node.parentElement) parents.unshift(node);
            let background = [255, 255, 255];
            for (const node of parents) background = blend(rgba(getComputedStyle(node).backgroundColor), background);
            const style = getComputedStyle(element);
            const ink = blend(rgba(style.webkitTextFillColor || style.color), background);
            const ratio = (Math.max(lum(ink), lum(background)) + .05) / (Math.min(lum(ink), lum(background)) + .05);
            const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
            if (ratio < (large ? 3 : 4.5)) failures.push({ text, ratio, className: element.className });
          }
          return failures;
        });
        assert.deepEqual(failures, [], `${state}: ${appearance} ${width}px contrast`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${state}: horizontal overflow`);
        const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", "pipe:0", "-c:v", "libwebp", "-q:v", "85", "-compression_level", "6", path.join(output, `invitation-${state}-${appearance}-${width}.webp`)], { input: await page.screenshot({ fullPage: true }) });
        assert.equal(encoded.status, 0, encoded.stderr?.toString());
      }
    }
    await page.evaluate(() => localStorage.setItem("envitefy:appearance:v1", "light"));
    await page.evaluate(buildAppearanceBootstrap());
    await page.setViewportSize({ width: 390, height: 844 });
  }
  try {
    await page.goto(base);
    await page.getByRole("button", { name: "Invite co-host", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Manage access" }); await dialog.waitFor();
    await page.getByText("Loading access…", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Invite co-host", exact: true }).isEnabled(), true, "a slow roster never blocks an invitation");
    assert.equal(await page.getByRole("button", { name: "Invite co-host", exact: true }).locator(".animate-spin").count(), 0);
    await page.getByLabel("Co-host email", { exact: true }).fill("new@test.com");
    await page.getByRole("button", { name: "Invite co-host", exact: true }).click();
    await page.getByText("Invitation sent. It expires in seven days.").waitFor();
    holdReads = false; heldReads.splice(0).forEach(resolve => { resolve(); });
    await Promise.all(readReplies);
    assert.equal(await page.getByText("new@test.com", { exact: true }).count(), 1, "a late initial GET cannot erase the newly created invitation");
    assert.deepEqual(actions[0], { email: "new@test.com" });
    for (const appearance of ["light", "dark"]) {
      await page.evaluate((value) => localStorage.setItem("envitefy:appearance:v1", value), appearance);
      await page.evaluate(buildAppearanceBootstrap());
      for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }, { width: 812, height: 375 }]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
        const expiry = dialog.getByText("Invites expire after 7 days.", { exact: true });
        await expiry.scrollIntoViewIfNeeded();
        const contrast = await expiry.evaluate((element) => {
          const context = document.createElement("canvas").getContext("2d");
          const rgb = (color) => {
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            return [...context.getImageData(0, 0, 1, 1).data];
          };
          const luminance = (channels) => channels.slice(0, 3).map(value => value / 255)
            .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
            .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
          const background = rgb(getComputedStyle(element.parentElement).backgroundColor);
          if (background[3] !== 255) return 0;
          const ink = luminance(rgb(getComputedStyle(element).color));
          const paper = luminance(background);
          return (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05);
        });
        assert.ok(contrast >= 4.5, `${appearance} ${viewport.width}px expiry contrast: ${contrast.toFixed(2)}:1`);
        const panel = await dialog.boundingBox();
        assert.ok(panel.x >= 0 && panel.x + panel.width <= viewport.width && panel.y >= 0 && panel.y + panel.height <= viewport.height);
        assert.ok(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), "dialog must not overflow horizontally");
        const done = await dialog.getByRole("button", { name: "Done", exact: true }).boundingBox();
        assert.ok(done.width >= 44 && done.height >= 44);
        assert.ok(done.y + done.height <= viewport.height, "footer action remains on screen");
        await page.screenshot({ path: path.join(output, `access-${appearance}-${viewport.width}.png`) });
      }
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
    assert.ok(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), "enlarged text must not overflow");
    await page.evaluate(() => { document.documentElement.style.fontSize = ""; localStorage.setItem("envitefy:appearance:v1", "light"); });
    await page.evaluate(buildAppearanceBootstrap());
    await page.setViewportSize({ width: 390, height: 844 });
    const bounds = await dialog.boundingBox(); assert.ok(bounds.x >= 0 && bounds.x+bounds.width <= 391);
    const close = await page.getByRole("button", { name: "Close manage access" }).boundingBox(); assert.ok(close.height >= 44 && close.width >= 44);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Manage access", exact: true }).waitFor();
    await page.reload();
    await page.getByRole("button", { name: "Manage access", exact: true }).waitFor();
    assert.equal(await page.getByRole("dialog").count(), 0, "saved invitations update the trigger without opening the dialog");
    holdReads = true;
    await page.getByRole("button", { name: "Manage access", exact: true }).click();
    await page.getByText("Refreshing access…", { exact: true }).waitFor();
    assert.equal(await page.getByText("new@test.com", { exact: true }).count(), 1, "reopening shows the previous roster while refreshing");
    assert.equal(await page.getByRole("button", { name: "Invite co-host", exact: true }).isEnabled(), true);
    await page.keyboard.press("Escape");
    holdReads = false; heldReads.splice(0).forEach(resolve => { resolve(); });
    await Promise.all(readReplies);
    await page.getByRole("button", { name: "Manage access", exact: true }).click();
    await page.getByText("Refreshing access…", { exact: true }).waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Resend", exact: true }).click();
    await page.getByText("Invitation sent. It expires in seven days.").waitFor();
    await page.getByRole("button", { name: "Cancel invitation", exact: true }).click();
    await page.getByText("Access removed. This person can no longer edit the event.").waitFor();
    await page.screenshot({ path: path.join(output, "access-mobile.png"), fullPage: true });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.activeElement?.tagName === "BUTTON" && document.activeElement.textContent === "Invite co-host");
    assert.equal(await page.getByRole("button", { name: "Invite co-host", exact: true }).evaluate(element => element === document.activeElement), true);
    actions.length = 0;
    await page.goto(`${base}/cohost-invite#${token}`);
    await page.getByRole("button", { name: "Create an account", exact: true }).waitFor();
    assert.equal(actions.filter(action => action.action === "accept").length, 0);
    assert.equal(new URL(page.url()).hash, "");
    await assertInvitationAppearance("signed-out");
    await page.getByRole("button", { name: "Create an account", exact: true }).click();
    await page.getByPlaceholder("First name", { exact: true }).fill("Alex");
    await page.getByPlaceholder("Last name", { exact: true }).fill("Host");
    await page.getByPlaceholder("Email", { exact: true }).fill("friend@test.com");
    await page.getByPlaceholder("Password", { exact: true }).fill("InvitedHost123!");
    await page.getByPlaceholder("Confirm password", { exact: true }).fill("InvitedHost123!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.getByRole("button", { name: "Accept invitation", exact: true }).waitFor();
    assert.equal(actions.filter(action => action.action === "accept").length, 0, "signup never automatically grants event access");
    await assertInvitationAppearance("ready");
    await page.screenshot({ path: path.join(output, "accept-mobile.png"), fullPage: true });
    await page.getByRole("button", { name: "Accept invitation", exact: true }).click();
    await page.waitForURL("**/event/qa-event?tab=event");
    assert.equal(actions.filter(action => action.action === "accept").length, 1);
    for (const appearance of ["light", "dark"]) for (const width of [320, 390, 1280, 1920]) {
      await page.evaluate(value => localStorage.setItem("envitefy:appearance:v1", value), appearance);
      await page.setViewportSize({ width, height: 844 });
      for (const role of ["cohost", "owner"]) {
        await page.goto(`${base}/event/qa-event?tab=event&role=${role}`);
        await page.locator("[data-owner-event-view]").waitFor();
        assert.equal(await page.getByText("Co-host", { exact: true }).count(), role === "cohost" ? 1 : 0);
        await openEventActions();
        assert.equal(await page.getByRole("link", { name: "Edit event", exact: true }).isVisible(), true);
        assert.equal(await page.getByRole("link", { name: "Preview event", exact: true }).isVisible(), true);
        assert.equal(await page.getByRole("button", { name: "Share event", exact: true }).isVisible(), true);
        assert.equal(await page.getByRole("button", { name: "Delete event", exact: true }).count(), role === "owner" ? 1 : 0);
        assert.equal(await page.getByRole("button", { name: /^(Invite co-host|Manage access)$/ }).count(), role === "owner" ? 1 : 0);
        assert.equal(await page.getByRole("button", { name: "Leave event as co-host", exact: true }).count(), role === "cohost" ? 1 : 0);
        assert.equal(await page.getByRole("tab").count(), 0, "no Guests or Messages tabs on the event canvas");
        assert.equal(await page.getByText("Manage guests", { exact: true }).count(), 0);
        assert.equal(await page.getByText("Message guests", { exact: true }).count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(output, `${role}-event-${appearance}-${width}.png`) });
        if (role === "cohost") {
          const before = actions.filter(action => action.action === "leave").length;
          await page.getByRole("button", { name: "Leave event as co-host", exact: true }).click();
          const dialog = page.getByRole("dialog", { name: "Leave event as co-host?", exact: true });
          await dialog.waitFor();
          await page.screenshot({ path: path.join(output, `leave-cohost-${appearance}-${width}.png`) });
          await page.keyboard.press("Escape");
          await dialog.waitFor({ state: "hidden" });
          assert.equal(actions.filter(action => action.action === "leave").length, before, "Escape never removes access");
          const more = page.getByRole("button", { name: "More event actions", exact: true });
          const focusTarget = await more.isVisible() ? more : page.getByRole("button", { name: "Leave event as co-host", exact: true });
          assert.equal(await focusTarget.evaluate(el => el === document.activeElement), true);
          await openEventActions();
          await page.getByRole("button", { name: "Leave event as co-host", exact: true }).click();
          await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
          assert.equal(actions.filter(action => action.action === "leave").length, before, "Cancel retains access");
        }
      }
    }
    await page.goto(`${base}/event/qa-event?tab=event&role=cohost`);
    await openEventActions();
    await page.getByRole("button", { name: "Leave event as co-host", exact: true }).click();
    const leaveDialog = page.getByRole("dialog", { name: "Leave event as co-host?", exact: true });
    leaveFails = true;
    await leaveDialog.getByRole("button", { name: "Leave event", exact: true }).click();
    await leaveDialog.getByRole("alert").waitFor();
    assert.equal(await leaveDialog.getByRole("alert").innerText(), "Please retry leaving this event.");
    leaveFails = false;
    await leaveDialog.getByRole("button", { name: "Leave event", exact: true }).click();
    await page.waitForURL(base + "/");
    assert.equal(actions.filter(action => action.action === "leave").length, 2);
    assert.ok(actions.filter(action => action.action === "leave").every(action => action.personId === null));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => sessionStorage.setItem("qa:email", "wrong@test.com"));
    await page.goto(`${base}/cohost-invite#${token}`);
    await page.getByText(/You’re signed in as wrong@test.com/).waitFor();
    await assertInvitationAppearance("wrong-account");
    assert.equal(await page.getByRole("button", { name: "Accept invitation", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Switch account", exact: true }).click();
    await page.getByPlaceholder("Email", { exact: true }).fill("friend@test.com");
    await page.getByPlaceholder("Password", { exact: true }).fill("InvitedHost123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("button", { name: "Accept invitation", exact: true }).waitFor();
    assert.equal(actions.filter(action => action.action === "accept").length, 1, "existing-user login also requires an explicit accept");
    available = false; await page.reload();
    await page.getByText(/This invitation has expired or has already been used/).waitFor();
    await assertInvitationAppearance("expired");
    assert.equal(await page.getByRole("button", { name: "Accept invitation", exact: true }).count(), 0);
    available = true;
    isSignupForm = true;
    await page.goto(base);
    await page.goto(`${base}/cohost-invite#${token}`);
    await page.getByText(/You can edit and publish this sign-up form, view and manage participants/).waitFor();
    await page.getByRole("button", { name: "Accept invitation", exact: true }).waitFor();
    assert.equal(actions.filter(action => action.action === "accept").length, 1, "form invitations also need explicit acceptance");
    await page.screenshot({ path: path.join(output, "signup-accept-mobile.png"), fullPage: true });
    await page.getByRole("button", { name: "Accept invitation", exact: true }).click();
    await page.waitForURL("**/smart-signup-form/qa-signup#signup-host-dashboard");
    assert.equal(actions.filter(action => action.action === "accept").length, 2);
    acceptedByCurrentUser = true;
    isSignupForm = false;
    await page.goto(`${base}/cohost-invite#${token}`);
    await page.getByRole("link", { name: "Open event workspace", exact: true }).waitFor();
    await assertInvitationAppearance("accepted");
    let releaseInspection;
    inspectionGate = new Promise(resolve => { releaseInspection = resolve; });
    await page.reload();
    await page.getByText("Loading invitation…", { exact: true }).waitFor();
    await assertInvitationAppearance("loading");
    inspectionGate = null;
    releaseInspection();
    await page.getByRole("link", { name: "Open event workspace", exact: true }).waitFor();
    inspectError = true;
    await page.reload();
    await page.getByRole("button", { name: "Try again", exact: true }).waitFor();
    await assertInvitationAppearance("error");
    assert.deepEqual(errors, []);
  } catch (error) { throw new Error(`${error.stack}\nBrowser errors: ${JSON.stringify(errors)}\nPage text: ${(await page.locator('body').innerText()).slice(0, 1000)}`); }
  finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
