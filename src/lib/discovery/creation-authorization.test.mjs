import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadFunction(file, name, dependencies) {
  const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const declaration = parsed.statements.find(node => node.name?.text === name);
  assert.ok(declaration, `Missing ${name}`);
  const compiled = ts.transpileModule(`${declaration.getText(parsed)}\nreturn ${name};`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function("exports", ...Object.keys(dependencies), compiled)({}, ...Object.values(dependencies));
}

const stamp = { version: 1, userId: "owner-1", product: "event_page", category: "soccer", authorizedAt: "2026-10-19T00:00:00.000Z" };

test("intake stamps only the authenticated server-authorized category and ignores forged request authorization", async () => {
  let captured;
  const checked = [];
  const intake = loadFunction("./intake.ts", "intakeDiscovery", {
    safeString: value => typeof value === "string" ? value.trim() : "",
    parseJsonRequestBody: request => request.json(),
    normalizeWorkflow: () => "sports",
    defaultTitleForWorkflow: () => "Sport Event",
    normalizeSportActivityKey: () => "soccer",
    normalizeSportEventArchetype: () => null,
    isGymMeetTemplateId: () => false,
    isFootballTemplateId: () => false,
    validDiscoveryIntakeKey: () => "valid-client-key",
    normalizeCreationCategory: category => category,
    requireCreationAccess: async (owner, requirement) => checked.push({ owner, requirement }),
    withIdempotentDiscoveryIntake: async (_owner, _key, create) => create("retained-event"),
    createDiscoveryPipelineState: () => ({ processingStage: "ingested" }),
    createDiscoveryShell: async params => { captured = params; return { eventId: "retained-event", discoveryId: "discovery-1", created: true }; },
    getSportActivityProfile: () => ({ label: "Soccer" }),
  });
  await intake({ userId: "owner-1", request: new Request("https://envitefy.com/api/discovery/intake", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "Soccer tournament October 25 at 9am at City Field.", creationAuthorization: { ...stamp, userId: "another-owner", category: "weddings", savedAt: "forged" } }) }) });
  assert.deepEqual(checked, [{ owner: "owner-1", requirement: { product: "event_page", category: "soccer" } }]);
  assert.equal(captured.source.creationAuthorization.userId, "owner-1");
  assert.equal(captured.source.creationAuthorization.category, "soccer");
  assert.equal(captured.source.creationAuthorization.savedAt, undefined);
  assert.equal(captured.source.creationAuthorization.version, 1);
  assert.ok(Number.isFinite(Date.parse(captured.source.creationAuthorization.authorizedAt)));
});

test("each worker stage reloads authoritative source authorization before further paid work", async () => {
  let revoked = false;
  let sourceReads = 0;
  let paidCalls = 0;
  const source = { type: "file", creationAuthorization: stamp };
  const guard = loadFunction("./run.ts", "assertActive", {
    throwIfDiscoveryCancelled: () => {},
    getEventHistoryById: async () => ({ id: "event-1", user_id: "owner-1", data: { creationAuthorization: { ...stamp, savedAt: "forged" }, manualEditor: { forged: true } } }),
    getEventPermissions: async () => ({ canEdit: true }),
    getEventDiscoveryByEventId: async () => { sourceReads++; return { source }; },
    requireDiscoveryCreationAccess: async (_history, authoritative, actor) => { assert.equal(authoritative, source); assert.equal(actor, "owner-1"); if (revoked) throw new Error("Access revoked"); },
    isDiscoveryCancellationRequested: async () => false,
  });
  const paidStage = async () => { await guard("event-1", undefined, "owner-1"); paidCalls++; };
  await paidStage();
  revoked = true;
  await assert.rejects(paidStage, /Access revoked/);
  assert.equal(paidCalls, 1);
  assert.equal(sourceReads, 2);
});

test("run endpoint returns an actionable denial without dispatching a revoked new import", async () => {
  let dispatched = false;
  const discovery = { eventId: "event-1", source: { creationAuthorization: stamp }, pipeline: { processingStage: "ingested" } };
  const post = loadFunction("../../app/api/discovery/[eventId]/run/route.ts", "POST", {
    NextResponse: Response,
    getServerSession: async () => ({}), authOptions: {}, resolveSessionUserId: async () => "owner-1",
    getEventHistoryById: async () => ({ id: "event-1", user_id: "owner-1", data: {} }),
    getEventPermissions: async () => ({ canEdit: true }),
    getEventDiscoveryByEventId: async () => discovery,
    requireDiscoveryCreationAccess: async (_history, source) => { assert.equal(source, discovery.source); throw new Error("Access revoked"); },
    creationAccessErrorResponse: () => Response.json({ error: "Request access. Your source is kept." }, { status: 403 }),
    dispatchDiscoveryPipeline: () => { dispatched = true; },
  });
  const response = await post(new Request("https://envitefy.com/api/discovery/event-1/run", { method: "POST" }), { params: Promise.resolve({ eventId: "event-1" }) });
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /source is kept/);
  assert.equal(dispatched, false);
});

test("the response lifecycle waits for the actual background worker Promise", async () => {
  let release;
  let finished = false;
  const task = loadFunction("./run.ts", "dispatchDiscoveryPipeline", {
    hasActiveDiscoveryPipeline: () => false,
    beginDiscoveryPipelineCancellationScope: () => new AbortController(),
    runDiscoveryPipeline: () => new Promise(resolve => { release = resolve; }),
    finishDiscoveryPipelineCancellationScope: () => { finished = true; },
  });
  const work = task("event-1", "owner-1");
  assert.ok(work instanceof Promise);
  assert.equal(finished, false);
  release(null);
  await work;
  assert.equal(finished, true);
});

test("run registers paid background processing with the server response lifecycle", async () => {
  let background;
  let dispatched = false;
  const post = loadFunction("../../app/api/discovery/[eventId]/run/route.ts", "POST", {
    NextResponse: Response, after: callback => { background = callback; },
    getServerSession: async () => ({}), authOptions: {}, resolveSessionUserId: async () => "owner-1",
    getEventHistoryById: async () => ({ id: "event-1", user_id: "owner-1", data: {} }),
    getEventPermissions: async () => ({ canEdit: true }),
    getEventDiscoveryByEventId: async () => ({ eventId: "event-1", source: { creationAuthorization: stamp }, pipeline: { processingStage: "ingested" } }),
    requireDiscoveryCreationAccess: async () => {}, isDiscoveryCancellationRequested: async () => false, hasActiveLease: () => false,
    dispatchDiscoveryPipeline: async () => { dispatched = true; },
  });
  const response = await post(new Request("https://envitefy.com/api/discovery/event-1/run", { method: "POST" }), { params: Promise.resolve({ eventId: "event-1" }) });
  assert.equal(response.status, 202);
  assert.equal(dispatched, false);
  assert.ok(background() instanceof Promise);
  assert.equal(dispatched, true);
});
