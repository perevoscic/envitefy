const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const { createImportedEventTheme } = loadTs("src/lib/imported-event-theme.ts");
const theme = createImportedEventTheme({ sport: "gymnastics", title: "Meet", seed: "test" });

test("image generation authorizes canonical saved sports categories and rejects non-owners", async () => {
  let row = { id: "event", user_id: "owner", data: { category: "Gymnastics" } };
  let requestedCategory;
  const background = [];
  const generated = [];
  const route = loadTs("src/app/api/events/[id]/theme-artwork/route.ts", {
    "next/server": { after: (task) => background.push(task), NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/auth": { getAuthenticatedRequestUser: async () => ({ ok: true, userId: "owner" }) },
    "@/lib/db": { getEventHistoryById: async () => row },
    "@/lib/creation-access-server": { checkCreationAccess: async (_user, operation) => { requestedCategory = operation.category; return null; } },
    "@/lib/imported-event-artwork": { generateImportedEventArtwork: async (...args) => generated.push(args), importedArtworkState: () => null },
  });
  const context = { params: Promise.resolve({ id: "event" }) };
  const request = (extra = {}) => new Request("https://app.test/api/events/event/theme-artwork", { method: "POST", body: JSON.stringify({ theme, ...extra }) });
  for (const [data, category] of [
    [{ category: "Gymnastics" }, "gymnastics"],
    [{ category: "Football Season" }, "football"],
    [{ category: "Sport Events" }, "sport-events"],
    [{ category: "Sports", templateEditor: { category: "soccer" } }, "soccer"],
  ]) {
    row = { ...row, data };
    assert.equal((await route.POST(request(), context)).status, 202);
    assert.equal(requestedCategory, category);
  }
  assert.equal(background.length, 4);
  row = { ...row, data: { category: "Gymnastics" } };
  const retained = { ...theme, artworkUrl: "https://assets.test/retained.webp" };
  const kept = await route.POST(request({ theme: retained }), context);
  assert.equal(kept.status, 200);
  assert.equal((await kept.json()).artwork.imageUrl, retained.artworkUrl);
  assert.equal(background.length, 4, "a design-only image request never schedules generation");
  assert.equal((await route.POST(request({ theme: retained, replace: true }), context)).status, 202);
  assert.equal(background.length, 5);
  await background.at(-1)();
  assert.equal(generated.at(-1)[2].replace, true);
  row = { ...row, user_id: "someone-else" };
  assert.equal((await route.POST(request(), context)).status, 404);
  assert.equal(background.length, 5);
  row = { ...row, user_id: "owner", data: { category: "Weddings" } };
  assert.equal((await route.POST(request(), context)).status, 400);
  assert.equal(background.length, 5);
});
