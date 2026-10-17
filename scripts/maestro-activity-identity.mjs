import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import { chromium } from "playwright";
import { contained, ROOT, selectScenarios } from "./lib/maestro-core.mjs";

// Read-only precondition for a UI upload. Never logs session cookies or tokens.
const [runId, attempt] = process.argv.slice(2);
if (!/^activity-QA\d{2}-\d+$/.test(runId || "")) throw new Error("Invalid activity run.");
if (!/^\d+-[a-z-]+-\d+$/.test(attempt || "")) throw new Error("Invalid activity attempt.");
const dir = contained(path.join(ROOT, "output/maestro"), runId);
const target = contained(dir, attempt);
const state = JSON.parse(await readFile(path.join(dir, "state.json"), "utf8"));
selectScenarios([state.account]);
const values = {
  ...parseEnv(await readFile(path.join(ROOT, ".env.maestro.local"), "utf8")),
  ...process.env,
};
const expectedEmail = values[`MAESTRO_${state.account}_EMAIL`];
if (!expectedEmail) throw new Error("Selected tester email is missing.");
const result = { account: state.account, checkedAt: new Date().toISOString(), passed: false };
try {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9223", { timeout: 15000 });
  const page = browser
    .contexts()
    .flatMap((context) => context.pages())
    .find((candidate) => candidate.url().startsWith("https://envitefy.com/"));
  if (!page) throw new Error("No Envitefy Chrome session is available for the identity check.");
  const response = await page.request.get("https://envitefy.com/api/auth/session", {
    timeout: 15000,
  });
  result.sessionStatus = response.status();
  if (!response.ok()) throw new Error(`Session check returned HTTP ${response.status()}.`);
  const session = await response.json();
  result.emailMatches =
    typeof session.user?.email === "string" &&
    session.user.email.toLowerCase() === expectedEmail.toLowerCase();
  if (!result.emailMatches)
    throw new Error("Active Envitefy account does not match the selected tester; upload stopped.");
  result.userId = session.user.id || null;
  const history = await page.request.get(
    "https://envitefy.com/api/history?view=full&time=all&limit=200&refresh=1",
    { timeout: 30000 },
  );
  result.historyStatus = history.status();
  if (!history.ok())
    throw new Error(`Duplicate check returned HTTP ${history.status()}; upload stopped.`);
  const body = await history.json();
  if (!Array.isArray(body.items) || body.diagnostics?.degradedReason)
    throw new Error("History was unavailable or degraded; duplicate creation cannot be ruled out.");
  result.existingTestEvents = body.items
    .filter(
      (item) =>
        new RegExp(`\\b${state.account}\\b`).test(String(item.title)) &&
        /test\s*workshop/i.test(String(item.title)),
    )
    .map((item) => ({ id: item.id, title: item.title }));
  if (result.existingTestEvents.length)
    throw new Error(
      "A matching saved test event already exists; inspect it before repeating the upload.",
    );
  result.passed = true;
} catch (error) {
  result.reason = error.message;
}
await writeFile(path.join(target, "account-precondition.json"), JSON.stringify(result, null, 2));
console.log(`${state.account} upload precondition: ${result.passed ? "passed" : result.reason}`);
// End this diagnostic client without closing the user's Android Chrome app.
process.exit(result.passed ? 0 : 1);
