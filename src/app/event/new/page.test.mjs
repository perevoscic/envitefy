import assert from "node:assert/strict";
import test from "node:test";
import loadTs from "../../../../scripts/lib/event-messages-test-loader.cjs";

test("legacy new creation uses Create and preserves its query context", async () => {
  let destination;
  const { default: page } = loadTs("src/app/event/new/page.tsx", { "next/navigation": { redirect: (href) => { destination = href; } } });
  await page({ searchParams: Promise.resolve({ source: "upload", intake: "token" }) });
  assert.equal(destination, "/create?source=upload&intake=token");
});
test("legacy saved edit reaches the saved event resolver with its identity intact", async () => {
  let destination;
  const { default: page } = loadTs("src/app/event/new/page.tsx", { "next/navigation": { redirect: (href) => { destination = href; } } });
  await page({ searchParams: Promise.resolve({ edit: "saved-id", embed: "1" }) });
  assert.equal(destination, "/event/saved-id?edit=saved-id&embed=1");
});
