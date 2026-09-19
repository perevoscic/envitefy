import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/utils/event-edit-route.ts", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, {
  module, exports: module.exports, URL, URLSearchParams,
  require(name) {
    if (name === "@/lib/manual-event-progress") return { manualEventEditHref: (_id, data) => data?.manualEditor?.path || null };
    if (name === "@/lib/template-categories") return { getTemplateCategory: () => null };
    if (name === "./event-url") return { buildEventPath: (id) => `/event/${encodeURIComponent(id)}` };
    throw new Error(`Unexpected import ${name}`);
  },
});
const { resolveOwnerEditHref, resolveEditHref } = module.exports;

test("owner edits keep chat-created cards, flyers and event pages in Design", () => {
  for (const primaryOutput of ["live_card", "digital_flyer", "event_page"]) {
    const data = { createdVia: "concierge", primaryOutput, coverImageUrl: "/saved.webp", conciergeDraft: { creationSessionId: "original-thread" } };
    assert.equal(resolveOwnerEditHref("saved", data, "Saved event", "/event/custom-slug?tab=rsvps"), "/event/custom-slug?tab=design");
    assert.equal(resolveOwnerEditHref("saved", data, "Saved event", "/event/custom-slug?edit=saved&editor=menu&preview=owner&embed=dashboard-preview&returnTo=%2Fchat&view=details"), "/event/custom-slug?tab=design");
    assert.equal(resolveOwnerEditHref("saved", data, "Saved event"), "/event/saved?tab=design");
    assert.equal(resolveEditHref("saved", data, "Saved event"), "/chat?thread=original-thread", "the creation resume route remains available outside owner editing");
  }
});

test("owner edits without artwork open event tools rather than the creation thread", () => {
  assert.equal(resolveOwnerEditHref("saved event", { createdVia: "chat", creationSessionId: "thread" }, "Saved event"), "/events/saved%20event/manage");
});

test("specialized event editors remain the destination of owner edits", () => {
  for (const data of [
    { category: "wedding", templateId: "wedding", variationId: "classic" },
    { createdVia: "meet-discovery", category: "gymnastics" },
    { createdVia: "ocr" },
    { manualEditor: { path: "/event/manual?edit=saved" } },
    { scanSchedule: { items: [{ title: "Practice" }] } },
  ]) {
    assert.equal(resolveOwnerEditHref("saved", data, "Event"), resolveEditHref("saved", data, "Event"));
  }
});

test("owner event page actions all use owner-specific edit routing", () => {
  const page = fs.readFileSync("src/app/event/[id]/page.tsx", "utf8");
  assert.match(page, /editHref=\{resolveOwnerEditHref\(row.id, data, title, ownerEventHref\)\}/);
  assert.match(page, /const editHref = resolveOwnerEditHref\(row.id, data, title, ownerEventHref\)/);
  assert.doesNotMatch(page, /\bbuildEditLink\(|resolveEditHref\(row.id, data, title\)/);
  const sidebar = fs.readFileSync("src/app/left-sidebar.controller.ts", "utf8");
  assert.match(sidebar, /setSelectedEventEditHref\(resolveOwnerEditHref\(row.id, row.data, title, ownerHref\)\)/);
  assert.doesNotMatch(sidebar, /\bresolveEditHref\(/);
});
