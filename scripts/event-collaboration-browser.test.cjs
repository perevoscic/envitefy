const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("owner access controls and invited signup/login preserve the event and explicit acceptance on mobile", { timeout: 120000 }, async () => {
  const output = path.resolve(".qa/event-collaboration-browser"); fs.mkdirSync(output, { recursive: true });
  const authMock = path.join(output, "auth.ts");
  fs.writeFileSync(authMock, `export async function signIn(_provider, options) {sessionStorage.setItem('qa:email',options.email);return {ok:true};} export async function signOut(options) {sessionStorage.removeItem('qa:email');if(options.redirect!==false)location.assign(options.callbackUrl);}`);
  const sidebarMock = path.join(output, "sidebar.ts"); fs.writeFileSync(sidebarMock, "export function useSidebar(){return {setIsCollapsed(){}}}");
  const recaptchaMock = path.join(output, "recaptcha.ts"); fs.writeFileSync(recaptchaMock, "export function useRecaptcha(){return {executeRecaptcha:async()=> 'qa-token',loading:false}};");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({ mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/event-collaboration/entry.tsx"), output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "next-auth/react": authMock, "@/app/sidebar-context": sidebarMock, "@/hooks/useRecaptcha": recaptchaMock, "@": path.resolve("src") } },
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }, { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" }] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/EventAccessDialog.tsx";\n@source "./cohost-invite/CoHostInvitation.tsx";\n@source "../components/auth/*.tsx";\n@source "../../scripts/fixtures/event-collaboration/entry.tsx";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js") { res.setHeader("Content-Type", "text/javascript"); res.end(script); }
    else { res.setHeader("Content-Type", "text/html"); res.end(`<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body style="background:#f4f3fa"><main id="root"></main><script src="/fixture.js"></script></body></html>`); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }).catch(async error => { await new Promise(resolve => server.close(resolve)); throw error; });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; const actions = []; const token = "a".repeat(64); let people = []; let available = true;
  let holdReads = true; const heldReads = []; const readReplies = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.pathname === "/api/events/qa-event/collaborators") {
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
      if (input.action === "accept") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ eventId: "qa-event", href: "/event/qa-event?tab=dashboard" }) });
      const signedInEmail = await page.evaluate(() => sessionStorage.getItem("qa:email"));
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ title: "Garden party", ownerName: "Taylor", email: "friend@test.com", available, accepted: false, acceptedByCurrentUser: false, signedInEmail }) });
    }
    if (url.pathname.startsWith("/api/auth/") || url.pathname.startsWith("/api/legal/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (request.url().startsWith(base)) return route.continue();
    return route.abort();
  });
  try {
    await page.goto(base);
    await page.getByRole("button", { name: "Manage access", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Manage access" }); await dialog.waitFor();
    await page.getByText("Loading access…", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Invite co-host", exact: true }).isEnabled(), true, "a slow roster never blocks an invitation");
    assert.equal(await page.getByRole("button", { name: "Invite co-host", exact: true }).locator(".animate-spin").count(), 0);
    await page.getByLabel("Co-host email", { exact: true }).fill("new@test.com");
    await page.getByRole("button", { name: "Invite co-host", exact: true }).click();
    await page.getByText("Invitation sent. It expires in seven days.").waitFor();
    holdReads = false; heldReads.splice(0).forEach(resolve => resolve());
    await Promise.all(readReplies);
    assert.equal(await page.getByText("new@test.com", { exact: true }).count(), 1, "a late initial GET cannot erase the newly created invitation");
    assert.deepEqual(actions[0], { email: "new@test.com" });
    const bounds = await dialog.boundingBox(); assert.ok(bounds.x >= 0 && bounds.x+bounds.width <= 391);
    const close = await page.getByRole("button", { name: "Close manage access" }).boundingBox(); assert.ok(close.height >= 44 && close.width >= 44);
    await page.keyboard.press("Escape");
    holdReads = true;
    await page.getByRole("button", { name: "Manage access", exact: true }).click();
    await page.getByText("Refreshing access…", { exact: true }).waitFor();
    assert.equal(await page.getByText("new@test.com", { exact: true }).count(), 1, "reopening shows the previous roster while refreshing");
    assert.equal(await page.getByRole("button", { name: "Invite co-host", exact: true }).isEnabled(), true);
    await page.keyboard.press("Escape");
    holdReads = false; heldReads.splice(0).forEach(resolve => resolve());
    await Promise.all(readReplies);
    await page.getByRole("button", { name: "Manage access", exact: true }).click();
    await page.getByText("Refreshing access…", { exact: true }).waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Resend", exact: true }).click();
    await page.getByText("Invitation sent. It expires in seven days.").waitFor();
    await page.getByRole("button", { name: "Cancel invitation", exact: true }).click();
    await page.getByText("Access removed. This person can no longer edit the event.").waitFor();
    await page.screenshot({ path: path.join(output, "access-mobile.png"), fullPage: true });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.activeElement?.tagName === "BUTTON" && document.activeElement.textContent === "Manage access");
    assert.equal(await page.getByRole("button", { name: "Manage access", exact: true }).evaluate(element => element === document.activeElement), true);
    actions.length = 0;
    await page.goto(`${base}/cohost-invite#${token}`);
    await page.getByRole("button", { name: "Create an account", exact: true }).waitFor();
    assert.equal(actions.filter(action => action.action === "accept").length, 0);
    assert.equal(new URL(page.url()).hash, "");
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
    await page.screenshot({ path: path.join(output, "accept-mobile.png"), fullPage: true });
    await page.getByRole("button", { name: "Accept invitation", exact: true }).click();
    await page.waitForURL("**/event/qa-event?tab=dashboard");
    assert.equal(actions.filter(action => action.action === "accept").length, 1);
    await page.evaluate(() => sessionStorage.setItem("qa:email", "wrong@test.com"));
    await page.goto(`${base}/cohost-invite#${token}`);
    await page.getByText(/You’re signed in as wrong@test.com/).waitFor();
    assert.equal(await page.getByRole("button", { name: "Accept invitation", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Switch account", exact: true }).click();
    await page.getByPlaceholder("Email", { exact: true }).fill("friend@test.com");
    await page.getByPlaceholder("Password", { exact: true }).fill("InvitedHost123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("button", { name: "Accept invitation", exact: true }).waitFor();
    assert.equal(actions.filter(action => action.action === "accept").length, 1, "existing-user login also requires an explicit accept");
    available = false; await page.reload();
    await page.getByText(/This invitation has expired or has already been used/).waitFor();
    assert.equal(await page.getByRole("button", { name: "Accept invitation", exact: true }).count(), 0);
    assert.deepEqual(errors, []);
  } catch (error) { throw new Error(`${error.stack}\nBrowser errors: ${JSON.stringify(errors)}\nPage text: ${(await page.locator('body').innerText()).slice(0, 1000)}`); }
  finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
