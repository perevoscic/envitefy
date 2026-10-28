import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import ts from "typescript";
import { redactDiscoverySourceForPublicView } from "../../../lib/discovery-public-redact.ts";
import { isEventDraft } from "../../../lib/event-draft-access.ts";

const loadTs = createRequire(import.meta.url)("../../../../scripts/lib/event-messages-test-loader.cjs");
const { manualEventEditHref } = loadTs("src/lib/manual-event-progress.ts");

const source = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
// Inspect the renderer, whose routing is wrapped by EventPage's outage boundary.
const page = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "RenderEventPage");

test("unsupported public events end at notFound without a retired renderer or server actions after it", () => {
  assert.ok(page?.body);
  const statements = page.body.statements;
  const fallback = statements.findIndex(node => ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && node.expression.expression.getText(ast) === "notFound");
  assert.ok(fallback > 0, "the final unknown-renderer path retains its 404");
  assert.equal(fallback, statements.length - 1, "retired markup after the terminal 404 is unreachable and must not retain guest/share actions");
  const terminal = statements[fallback];
  const raiseNotFound = () => { throw new Error("NEXT_HTTP_ERROR_FALLBACK;404"); };
  const dispatch = new Function("notFound", terminal.getText(ast));
  assert.throws(() => dispatch(raiseNotFound), /NEXT_HTTP_ERROR_FALLBACK;404/);
});

test("recognized templates retain dedicated dispatch before the unknown-renderer fallback", () => {
  const route = page.getText(ast);
  for (const component of ["ConciergeEventWebsite", "BirthdaySkin", "GenderRevealTemplateView", "FootballDiscoveryContent", "SimpleTemplateView"]) {
    assert.ok(route.indexOf(`<${component}`) >= 0, `${component} must remain a supported renderer`);
    assert.ok(route.indexOf(`<${component}`) < route.lastIndexOf("notFound()"));
  }
});

test("saved owner drafts resume supported manual editors before entering the public owner canvas", () => {
  const statements = page.body.statements;
  const branch = statements.find(node => ts.isIfStatement(node) && node.expression.getText(ast).includes("isEventDraft(row.data)"));
  assert.ok(branch, "saved authored drafts need an editor redirect before the public renderer");
  const route = page.getText(ast);
  assert.ok(route.indexOf(branch.getText(ast)) < route.indexOf("if (showOwnerEventView && !editParam)"), "redirect saved drafts before mounting the owner's embedded public preview");
  const dispatch = new Function("isOwner", "row", "isEventDraft", "manualEventEditHref", "resolveEditHref", "redirect", ts.transpile(branch.getText(ast)));
  const fixtures = [
    ...["/event/general/customize", "/event/special-events/customize", "/event/manual"].map(path => ({
      name: `supported manual draft ${path}`,
      owner: true,
      data: { status: "draft", createdVia: "manual", manualEditor: { path, snapshot: { data: { title: "" } } } },
      expected: `${path}?edit=saved-manual`,
    })),
    { name: "template draft", owner: true, data: { status: "draft", templateEditor: { category: "birthdays", templateId: "candy-dreams" } }, expected: "/resolved-editor" },
    { name: "custom draft", owner: true, data: { draftStatus: "draft", customEventPage: { version: 1 } }, expected: "/resolved-editor" },
    { name: "published manual event", owner: true, data: { status: "published", manualEditor: { path: "/event/general/customize" } }, expected: null },
    { name: "legacy published manual event", owner: true, data: { manualEditor: { path: "/event/general/customize" } }, expected: null },
    { name: "nonowner manual draft", owner: false, data: { status: "draft", manualEditor: { path: "/event/general/customize" } }, expected: null },
    { name: "orphan manual draft with unknown editor", owner: true, data: { status: "draft", manualEditor: { path: "/retired-editor" } }, expected: null },
    { name: "manual draft with external editor path", owner: true, data: { status: "draft", manualEditor: { path: "https://example.test/editor" } }, expected: null },
    { name: "manual draft without editor path", owner: true, data: { status: "draft", manualEditor: { snapshot: {} } }, expected: null },
    { name: "unrecognized draft", owner: true, data: { status: "draft" }, expected: null },
  ];
  for (const fixture of fixtures) {
    const row = { id: "saved-manual", title: "Event draft", data: fixture.data };
    const destinations = [], resolved = [];
    dispatch(fixture.owner, row, isEventDraft, manualEventEditHref, (id, data, title) => {
      resolved.push({ id, data, title });
      return manualEventEditHref(id, data) || "/resolved-editor";
    }, href => destinations.push(href));
    assert.deepEqual(destinations, fixture.expected ? [fixture.expected] : [], fixture.name);
    assert.deepEqual(resolved, fixture.expected ? [{ id: row.id, data: row.data, title: row.title }] : [], `${fixture.name}: only eligible drafts resolve an editor`);
  }
});

test("legacy event links open standalone signup forms instead of the unsupported-renderer 404", () => {
  const statements = page.body.statements;
  const branch = statements.find(node => ts.isIfStatement(node) && node.expression.getText(ast) === 'primaryProductOutput === "signup_form"');
  assert.ok(branch, "standalone signup forms need a public route before the 404 fallback");
  const route = page.getText(ast);
  assert.ok(route.indexOf(branch.getText(ast)) > route.indexOf("if (showOwnerWorkspace && resolvedOwnerToolsTab)"), "keep the owner's management workspace available");
  assert.ok(route.indexOf(branch.getText(ast)) < route.indexOf("const rawThumbnailValue"), "redirect before unrelated public render preparation");
  const dispatch = new Function("primaryProductOutput", "publicEventHref", "ownerPreviewMode", "ownerPreviewEmbedded", "ownerPreviewReturnHref", "redirect", ts.transpile(branch.getText(ast)));
  const href = "/smart-signup-form/pumpkin-day-at-upper-school-lunchroom";
  const destinations = [];
  for (const preview of [false, true]) {
    dispatch("signup_form", href, preview, preview, "", next => destinations.push(next));
  }
  assert.deepEqual(destinations, [href, `${href}?preview=owner&embed=dashboard-preview`]);
  destinations.length = 0;
  dispatch("signup_form", href, true, false, "/event/pumpkin-day-at-upper-school-lunchroom?tab=event", next => destinations.push(next));
  const preview = new URL(destinations[0], "https://envitefy.test");
  assert.equal(preview.searchParams.get("returnTo"), "/event/pumpkin-day-at-upper-school-lunchroom?tab=event");
  destinations.length = 0;
  dispatch("event_page", href, false, false, "", next => destinations.push(next));
  assert.deepEqual(destinations, [], "embedded signup forms must keep their original event renderer");
});

test("reachable sharing checks retain owner, anonymous, accepted, pending and missing-share-table behavior", async () => {
  const statements = page.body.statements;
  const start = statements.findIndex(node => ts.isVariableStatement(node) && node.declarationList.declarations[0].name.getText(ast) === "recipientAccepted");
  const end = statements.findIndex((node, index) => index > start && ts.isIfStatement(node) && node.expression.getText(ast) === "!isOwner && !collaborationPermissions.canEdit");
  assert.ok(start >= 0 && end > start);
  const code = statements.slice(start, end + 1).map(node => node.getText(ast)).join("\n");
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  for (const fixture of [
    { owner: true, userId: "owner", access: false, pending: false, accepted: false, readonly: false },
    { owner: false, userId: null, access: false, pending: false, accepted: false, readonly: true },
    { owner: false, userId: "guest", access: true, pending: false, accepted: true, readonly: false },
    { owner: false, userId: "guest", access: false, pending: false, accepted: false, readonly: true },
    { owner: false, userId: "guest", access: null, pending: false, accepted: false, readonly: true },
    { owner: false, userId: "guest", access: false, pending: true, accepted: false, readonly: false },
  ]) {
    for (const autoAccept of [false, true]) {
      const writes = [];
      const run = new AsyncFunction("isOwner", "userId", "row", "timing", "isEventSharedWithUser", "isEventSharePendingForUser", "autoAccept", "fetch", "collaborationPermissions", `${ts.transpile(code)}; return { recipientAccepted, isReadOnly };`);
      const result = await run(fixture.owner, fixture.userId, { id: "offline-event" }, { time: (_name, fn) => fn() }, async () => fixture.access, async () => fixture.pending, autoAccept, async (...args) => { writes.push(args); }, { canEdit: fixture.owner, role: fixture.owner ? "owner" : null });
      assert.deepEqual(result, { recipientAccepted: fixture.accepted, isReadOnly: fixture.readonly });
      assert.equal(writes.length, fixture.pending && autoAccept ? 1 : 0);
      if (writes.length) assert.deepEqual(JSON.parse(writes[0][1].body), { eventId: "offline-event" });
    }
  }
});

test("public renderer retains discovery media and private signup-response redaction", () => {
  const statements = page.body.statements;
  const start = statements.findIndex(node => ts.isVariableStatement(node) && node.declarationList.declarations[0].name.getText(ast) === "clientSafeEventData");
  const code = statements.slice(start, start + 2).map(node => node.getText(ast)).join("\n");
  const renderData = new Function("canManageCreatedEvent", "data", "projectedSignupForm", "redactDiscoverySourceForPublicView", `${ts.transpile(code)}; return clientSafeEventData;`);
  const original = { title: "September 23 workshop", discoverySource: { input: { type: "file", dataUrl: "private-document", storageUrl: "private-storage", storagePathname: "private-path", name: "schedule.pdf" } }, signupForm: { responses: ["private-email"] }, responses: ["private-email"], templateEditor: { private: true } };
  const projected = { title: "Guest signup", responses: [] };
  const guest = renderData(false, structuredClone(original), projected, redactDiscoverySourceForPublicView);
  assert.deepEqual(guest.discoverySource.input, { type: "file", name: "schedule.pdf" });
  assert.deepEqual(guest.signupForm, projected);
  assert.equal(guest.responses, undefined);
  assert.equal(guest.templateEditor, undefined);
  assert.deepEqual(renderData(true, structuredClone(original), projected, redactDiscoverySourceForPublicView), original);
});
