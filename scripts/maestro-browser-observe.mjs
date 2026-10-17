import { appendFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { contained, ROOT, redact, selectScenarios } from "./lib/maestro-core.mjs";

// Read-only diagnostics for the TWA's Chrome pages. No cookies, headers,
// raw request bodies, credential values or URL query strings are collected.
// OCR/history date fields are allowlisted to trace time conversion defects.
const runId = process.argv[2];
if (!/^activity-QA\d{2}-\d+$/.test(runId || "")) throw new Error("Select an activity run ID.");
const dir = contained(path.join(ROOT, "output/maestro"), runId);
const state = JSON.parse(await readFile(path.join(dir, "state.json"), "utf8"));
selectScenarios([state.account]);
const file = path.join(dir, "web-events.jsonl");
const cleanUrl = (value) => {
  try {
    const url = new URL(value);
    return url.origin + url.pathname;
  } catch {
    return "unavailable";
  }
};
const cleanText = (value) =>
  redact(String(value).replace(/https?:\/\/[^\s"<>]+/g, cleanUrl)).slice(0, 4000);
const log = (event) =>
  appendFileSync(file, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`);
log({
  event: "observer_start",
  note: "Chrome diagnostic connection only; it does not drive the app or replace Maestro tests.",
});
const browser = await chromium.connectOverCDP("http://127.0.0.1:9223", { timeout: 15000 });
const seen = new Set();
let nextPage = 0;
const attach = (page) => {
  if (seen.has(page)) return;
  seen.add(page);
  const id = ++nextPage;
  const relevant = () => page.url().startsWith("https://envitefy.com/");
  const emit = (event) => {
    if (relevant()) log({ page: id, pageUrl: cleanUrl(page.url()), ...event });
  };
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      emit({ event: "console", level: message.type(), message: cleanText(message.text()) });
  });
  page.on("pageerror", (error) =>
    emit({ event: "page_error", message: cleanText(error.stack || error.message) }),
  );
  page.on("requestfailed", (request) =>
    emit({
      event: "request_failed",
      method: request.method(),
      url: cleanUrl(request.url()),
      message: cleanText(request.failure()?.errorText || "unknown"),
    }),
  );
  page.on("request", (request) => {
    if (!relevant() || !["fetch", "xhr"].includes(request.resourceType())) return;
    emit({ event: "request_start", method: request.method(), url: cleanUrl(request.url()) });
    if (
      request.method() !== "POST" ||
      cleanUrl(request.url()) !== "https://envitefy.com/api/history"
    )
      return;
    try {
      const body = request.postDataJSON();
      emit({
        event: "history_request_dates",
        title: cleanText(body.title || ""),
        startISO: body.data?.startISO,
        endISO: body.data?.endISO,
        timezone: body.data?.timezone,
      });
    } catch {
      /* Never log unparsed request bodies. */
    }
  });
  page.on("response", async (response) => {
    if (!["fetch", "xhr", "document"].includes(response.request().resourceType())) return;
    emit({
      event: "response",
      method: response.request().method(),
      url: cleanUrl(response.url()),
      status: response.status(),
    });
    if (response.ok() && cleanUrl(response.url()) === "https://envitefy.com/api/ocr") {
      try {
        const body = await response.json();
        emit({
          event: "ocr_response_dates",
          title: cleanText(body.fieldsGuess?.title || ""),
          start: body.fieldsGuess?.start,
          end: body.fieldsGuess?.end,
          timezone: body.fieldsGuess?.timezone,
        });
      } catch {
        /* The response status remains evidence. */
      }
    }
    if (response.status() < 400 || !response.url().startsWith("https://envitefy.com/api/")) return;
    try {
      const body = await response.json();
      const error = Object.fromEntries(
        ["error", "message", "code", "requestId", "traceId"]
          .filter((key) => typeof body[key] === "string")
          .map((key) => [key, cleanText(body[key])]),
      );
      emit({
        event: "api_error",
        url: cleanUrl(response.url()),
        status: response.status(),
        details: error,
      });
    } catch {
      /* Response status remains evidence when its body is unavailable. */
    }
  });
};
for (const context of browser.contexts()) {
  context.pages().forEach(attach);
  context.on("page", attach);
}
console.log(`Read-only Chrome diagnostics: ${file}`);
const finish = () => {
  log({ event: "observer_end" });
  process.exit(0);
};
process.once("SIGINT", finish);
process.once("SIGTERM", finish);
setTimeout(finish, 600000);
