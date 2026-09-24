const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

const { TEMPLATE_CATEGORIES } = loadTs("src/lib/template-categories.ts");
const { buildTemplateDraftPayload } = loadTs("src/lib/template-draft-payload.ts");
const { saveTemplateDraftToAccount } = loadTs("src/lib/template-draft-handoff.ts");
const { buildEventProductPath } = loadTs("src/utils/event-product-route.ts");

for (const category of TEMPLATE_CATEGORIES) {
  test(`${category.slug} explicitly saves its public renderer on draft and publish`, async () => {
    for (const status of ["draft", "published"]) {
      const snapshot = { data: { title: "Menu tasting invite and signup", date: "2030-10-10" } };
      const payload = buildTemplateDraftPayload(snapshot, category.slug, "America/Chicago");
      const output = category.slug === "signup-forms" ? "signup_form" : "event_page";
      assert.equal(payload.data.primaryOutput, output);
      const draft = { id: "local", eventId: "saved", snapshot, assets: {} };
      let saved;
      await saveTemplateDraftToAccount({
        draft, payload: { ...payload, data: { ...payload.data, primaryOutput: "live_card" } },
        category: category.slug, templateId: "test", status, authenticated: true, remoteMedia: {},
        request: async (_url, options) => {
          saved = JSON.parse(options.body);
          return Response.json({ id: "saved", data: saved.data });
        },
      });
      assert.equal(saved.data.primaryOutput, output);
      assert.equal(saved.data.status, status);
      const prefix = output === "signup_form" ? "/smart-signup-form/" : "/event/";
      assert.equal(buildEventProductPath({ eventId: "saved", title: saved.title, data: saved.data, publicSlug: "chosen-address" }), `${prefix}chosen-address`);
    }
  });
}

test("both admin event lists retain legacy routing evidence without loading event content", async () => {
  const rows = [
    { id: "form", title: "Pumpkin Day", public_slug: "pumpkin-day", routing_data: { createdVia: "template", templateEditor: { category: "signup-forms" }, signupForm: {} } },
    { id: "card", title: "Dinner", public_slug: "dinner", routing_data: { createdVia: "livecard-builder" } },
    { id: "page", title: "A new menu invite", public_slug: "menu-tasting", routing_data: { templateEditor: { category: "future-category" } } },
  ];
  const statements = [];
  const stubs = {
    "@/lib/db": { query: async (sql) => { statements.push(sql); return { rows: sql.includes("as routing_data") ? rows : [] }; } },
    "@/lib/scan-attempts": {},
  };
  const { getAdminUserDebugLinks } = loadTs("src/lib/admin/users.ts", stubs);
  const { getAdminEventsData } = loadTs("src/lib/admin/events.ts", stubs);
  const debug = await getAdminUserDebugLinks("owner", "events");
  const admin = await getAdminEventsData();
  for (const items of [debug, admin.recentEvents]) {
    assert.deepEqual(items.map(item => buildEventProductPath({ eventId: item.id, title: item.title, data: { primaryOutput: item.primaryOutput }, publicSlug: item.publicSlug })), [
      "/smart-signup-form/pumpkin-day", "/card/dinner", "/event/menu-tasting",
    ]);
  }
  for (const sql of statements.filter(sql => sql.includes("as routing_data"))) {
    assert.match(sql, /templateEditor/);
    assert.doesNotMatch(sql, /snapshot|signupForm,responses|studioCard,background/);
  }
});

test("changing a public slug returns the product URL and a separate owner workspace URL", async () => {
  for (const [primaryOutput, prefix] of [["signup_form", "smart-signup-form"], ["live_card", "card"], ["event_page", "event"]]) {
    const row = { id: "saved", user_id: "owner", title: "Dinner", public_slug: "dinner", data: { primaryOutput } };
    const { PATCH } = loadTs("src/app/api/events/[id]/public-slug/route.ts", {
      "next-auth": { getServerSession: async () => ({}) },
      "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "owner" },
      "@/lib/db": {
        getEventHistoryById: async () => row,
        updateEventHistoryPublicSlug: async () => ({ ...row, public_slug: "new-address" }),
        listShareRecipientUserIdsForEvent: async () => [],
      },
      "@/lib/dashboard-cache": { invalidateUserDashboard() {} },
      "@/lib/history-cache": { invalidateUserHistory() {} },
    });
    const response = await PATCH(new Request("https://envitefy.test/api/events/saved/public-slug", { method: "PATCH", body: JSON.stringify({ publicSlug: "new-address" }) }), { params: Promise.resolve({ id: "saved" }) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.publicPath, `/${prefix}/new-address`);
    assert.equal(body.eventPath, "/event/new-address");
  }
});
