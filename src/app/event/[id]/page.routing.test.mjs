import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import { redactDiscoverySourceForPublicView } from "../../../lib/discovery-public-redact.ts";

const source = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const page = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "EventPage");

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

test("reachable sharing checks retain owner, anonymous, accepted, pending and missing-share-table behavior", async () => {
  const statements = page.body.statements;
  const start = statements.findIndex(node => ts.isVariableStatement(node) && node.declarationList.declarations[0].name.getText(ast) === "recipientAccepted");
  const end = statements.findIndex((node, index) => index > start && ts.isIfStatement(node) && node.expression.getText(ast) === "!isOwner");
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
      const run = new AsyncFunction("isOwner", "userId", "row", "timing", "isEventSharedWithUser", "isEventSharePendingForUser", "autoAccept", "fetch", `${ts.transpile(code)}; return { recipientAccepted, isReadOnly };`);
      const result = await run(fixture.owner, fixture.userId, { id: "offline-event" }, { time: (_name, fn) => fn() }, async () => fixture.access, async () => fixture.pending, autoAccept, async (...args) => { writes.push(args); });
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
