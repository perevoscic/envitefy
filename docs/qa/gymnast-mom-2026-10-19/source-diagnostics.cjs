/*
 * Offline characterization diagnostics for the gymnast-parent journey.
 * Run: node docs/qa/gymnast-mom-2026-10-19/source-diagnostics.cjs
 *
 * Executes callbacks extracted from the current application TypeScript AST.
 * No application source is copied, no browser or provider is contacted, and no
 * account, event, database, or application source is changed. Transport and UI
 * state setters are stubbed at their boundaries. Assertions characterize the
 * observed defects; exit code 0 means the diagnostics ran, not that QA passed.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const ts = require("typescript");

const root = path.resolve(__dirname, "../../..");
const sourceFiles = new Map();
function source(relative) {
  if (!sourceFiles.has(relative)) {
    const text = fs.readFileSync(path.join(root, relative), "utf8");
    sourceFiles.set(relative, {
      text,
      ast: ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true,
        relative.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS),
    });
  }
  return sourceFiles.get(relative);
}
function find(relative, predicate) {
  const { ast } = source(relative);
  let result;
  function visit(node) {
    if (!result && predicate(node, ast)) result = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(result, `Source construct not found in ${relative}`);
  return result;
}
function evaluate(text, dependencies) {
  const js = ts.transpileModule(text, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React },
  }).outputText;
  return new Function(...Object.keys(dependencies), js)(...Object.values(dependencies));
}
function variable(relative, name, dependencies) {
  const { ast } = source(relative);
  const declaration = find(relative, node => ts.isVariableDeclaration(node) && node.name.getText(ast) === name);
  let expression = declaration.initializer;
  if (ts.isCallExpression(expression) && ["useCallback", "useMemo"].includes(expression.expression.getText(ast)))
    expression = expression.arguments[0];
  assert.ok(ts.isArrowFunction(expression) || ts.isFunctionExpression(expression), `${name} must be executable source`);
  return evaluate(`return (${expression.getText(ast)});`, dependencies);
}
function value(relative, name, dependencies) {
  const { ast } = source(relative);
  const declaration = find(relative, node => ts.isVariableDeclaration(node) && node.name.getText(ast) === name);
  return evaluate(`return (${declaration.initializer.getText(ast)});`, dependencies);
}
function declaredFunction(relative, name, dependencies) {
  const { ast } = source(relative);
  const declaration = find(relative, node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  return evaluate(`${declaration.getText(ast)}\nreturn ${name};`, { exports: {}, ...dependencies });
}
function location(relative, predicate) {
  const { ast } = source(relative), node = find(relative, predicate);
  return `${relative}:${ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1}`;
}

async function timezoneDiagnostic() {
  const relative = "src/app/event/gymnastics/customize/page.tsx";
  const calendarPath = "src/lib/calendar-date-time.ts";
  const calendar = {};
  evaluate(source(calendarPath).text, { exports: calendar });
  const savedZone = process.env.TZ;
  process.env.TZ = "America/Chicago";
  try {
    const data = {
      title: "Offline gymnastics fixture", date: "2027-01-16", time: "08:00",
      timezone: "America/Los_Angeles", endTime: "", endDate: "", extra: {},
      hero: "", sectionLayout: { version: 1 }, passcodeRequired: false,
    };
    const dependencies = {
      data, editEventId: "offline-import", isDiscoveryEdit: true,
      loadedDiscoveryPipelineSummary: { discoveryId: "offline-discovery", processingStage: "review_ready" },
      loadedDiscoverySource: { pipelineVersion: "gym-public-v3" },
      loadedDiscoveryPublicArtifacts: { hero: { title: data.title }, quickAccess: [] },
      config: { displayName: "Gymnastics", category: "gymnastics", slug: "gymnastics-schedule", detailFields: [] },
      getEventEndLocal: () => null,
      persistImageMediaValue: async ({ value }) => value,
      persistPublicEventMedia: async value => value,
      resolveGymMeetTemplateId: () => "offline-design",
      DEFAULT_GYM_MEET_TEMPLATE_ID: "offline-design",
      locationParts: "Offline venue", selectedSize: { id: "medium", className: "" },
      advancedState: {}, normalizeHeroImageSettings: value => value,
      normalizeGymnasticsPageText: value => value,
      normalizeGymnasticsTitleFont: value => value,
      isNewDraft: false, useParseDrivenSections: true,
    };
    const build = variable(relative, "buildEventPayload", dependencies);
    const preview = variable(relative, "previewEventData", dependencies);
    const raw = await build();
    const previewData = preview();
    const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const normalizeSave = declaredFunction("src/lib/create/editor-handoff.ts", "creationNativePayload", {
      object, parseCalendarDateTimeToIso: calendar.parseCalendarDateTimeToIso,
    });
    const final = normalizeSave(raw, { data });
    const sharedEditor = "src/components/events/useEventPageEditor.ts";
    find(sharedEditor, (node, ast) => ts.isCallExpression(node) &&
      node.expression.getText(ast) === "creationNativePayload" &&
      node.arguments[0].getText(ast) === "await buildPayload()");
    const guestView = "src/components/SimpleTemplateView.tsx";
    const calendarInput = { currentData: previewData, date: data.date, time: data.time,
      eventTimeZone: data.timezone, parseCalendarDateTimeToIso: calendar.parseCalendarDateTimeToIso };
    const guestStart = value(guestView, "guestStart", calendarInput);
    const calendarAllDay = value(guestView, "calendarAllDay", calendarInput);
    const previewGuestCalendarStart = value(guestView, "calendarStart", {
      ...calendarInput, guestStart, calendarAllDay,
    });
    const expected = calendar.parseCalendarDateTimeToIso(`${data.date}T${data.time}`, data.timezone);
    assert.equal(expected, "2027-01-16T16:00:00.000Z");
    assert.equal(raw.data.startISO, "2027-01-16T14:00:00.000Z");
    assert.equal(previewData.startISO, raw.data.startISO);
    assert.equal(final.data.startISO, expected, "Shared writer repairs the top-level value; do not report this as a top-level persisted calendar defect");
    assert.equal(final.data.builderDraft.event.startISO, raw.data.startISO,
      "The nested imported event retains the browser-zone instant");
    assert.equal(previewGuestCalendarStart, raw.data.startISO,
      "The shared guest calendar code selects the preview's incorrect ISO ahead of the local date/time");
    return {
      scenario: "08:00 Los Angeles meet while parent browser uses Chicago",
      status: "reproduced in actual source callbacks; top-level save repair also verified",
      browserZone: Intl.DateTimeFormat().resolvedOptions().timeZone, eventZone: data.timezone,
      expected, previewStartISO: previewData.startISO,
      previewGuestCalendarStart,
      finalTopLevelStartISO: final.data.startISO,
      finalNestedBuilderStartISO: final.data.builderDraft.event.startISO,
      nestedDifferenceHours: (Date.parse(final.data.builderDraft.event.startISO) - Date.parse(expected)) / 3_600_000,
      limit: "Published guest rendering/calendar impact requires live verification because the shared writer repairs top-level fields.",
    };
  } finally {
    if (savedZone === undefined) delete process.env.TZ; else process.env.TZ = savedZone;
  }
}

async function dateOnlyMeetDiagnostic() {
  const core = "src/lib/meet-discovery/core.ts";
  const editor = "src/app/event/gymnastics/customize/page.tsx";
  const safeString = value => typeof value === "string" ? value.trim() : "";
  const dependencies = { safeString };
  for (const name of ["toIsoOrNull", "toIsoDateOnlyOrNull", "hasExplicitIsoTimeComponent", "hasAnyDiscoveryTimeSignal", "hasExplicitDiscoveryStartTime", "splitDateTime"])
    dependencies[name] = declaredFunction(core, name, dependencies);
  const savedZone = process.env.TZ;
  process.env.TZ = "America/Chicago";
  try {
    // This is a source reconstruction of the browser-observed March 6–8 meet,
    // not the raw model response or database record. No event time was supplied.
    const parseResult = {
      startAt: dependencies.toIsoOrNull("2026-03-06"),
      endAt: dependencies.toIsoOrNull("2026-03-08"), timezone: null,
      athlete: {}, meetDetails: {},
    };
    const hasExplicitStartTime = dependencies.hasExplicitDiscoveryStartTime(parseResult);
    assert.equal(dependencies.hasExplicitIsoTimeComponent(parseResult.startAt), false,
      "The specific ISO-time test correctly recognizes midnight as non-explicit");
    assert.equal(dependencies.hasAnyDiscoveryTimeSignal(parseResult), true,
      "The broader clock regex matches minutes/seconds inside synthetic midnight ISO values");
    assert.equal(hasExplicitStartTime, true,
      "That broad fallback incorrectly promotes a date-only meet into a timed event");
    const { date, time } = dependencies.splitDateTime(parseResult.startAt);
    const shell = declaredFunction("src/lib/discovery/persist.ts", "buildDiscoveryShellEventData", {
      getSportEventPreset: () => null, resolveGymDiscoveryTemplateSelection: () => "offline-design",
      buildEmptyGymBuilderDraft: () => ({}), buildEmptyGymPublicArtifacts: () => ({}),
      buildDiscoveryPipelineSummary: () => ({}),
    })({ workflow: "gymnastics", title: "Offline date-only meet", discoveryId: "offline", pipeline: {} });
    const mapDependencies = { ...dependencies, parseResult, hasExplicitStartTime,
      authoritativeDate: date, date, time,
      derivedRange: { startDate: "2026-03-06", endDate: "2026-03-08", label: "March 6-8, 2026" },
      hasDateConflictWithRange: false, baseData: shell };
    mapDependencies.mappedDate = value(core, "mappedDate", mapDependencies);
    const mappedTime = value(core, "mappedTime", mapDependencies);
    const mappedStartISO = value(core, "mappedStartISO", mapDependencies);
    const mappedEndISO = value(core, "mappedEndISO", mapDependencies);
    const { ast: coreAst } = source(core);
    const timezoneProperty = find(core, node => ts.isPropertyAssignment(node) &&
      node.name.getText(coreAst) === "timezone" &&
      node.initializer.getText(coreAst) === "parseResult.timezone || baseData?.timezone || null");
    const mappedTimezone = evaluate(`return (${timezoneProperty.initializer.getText(coreAst)});`, mapDependencies);
    const effectiveExisting = { date: mapDependencies.mappedDate, time: mappedTime,
      startISO: mappedStartISO, endISO: mappedEndISO, timezone: mappedTimezone };
    const { ast } = source(editor);
    const startDeclaration = find(editor, node => ts.isVariableDeclaration(node) &&
      node.name.getText(ast) === "startIso" && node.initializer?.getText(ast).includes("effectiveExisting.start"));
    const startStatement = startDeclaration.parent.parent;
    const statements = startStatement.parent.statements;
    const startIndex = statements.indexOf(startStatement);
    const startLoad = evaluate(statements.slice(startIndex, startIndex + 4).map(node => node.getText(ast)).join("\n") +
      "\nreturn { loadedDate, loadedTime };", { effectiveExisting });
    const eventLocalDateParts = declaredFunction("src/lib/event-guest-planning.ts", "eventLocalDateParts", {});
    const endProperties = {};
    for (const key of ["endDate", "endTime"]) {
      const property = find(editor, node => ts.isPropertyAssignment(node) && node.name.getText(ast) === key &&
        node.initializer.getText(ast).includes("eventLocalDateParts(effectiveExisting.endISO"));
      endProperties[key] = evaluate(`return (${property.initializer.getText(ast)});`, { effectiveExisting, eventLocalDateParts });
    }
    assert.equal(effectiveExisting.time, "00:00");
    assert.deepEqual(startLoad, { loadedDate: "2026-03-06", loadedTime: "00:00" });
    assert.deepEqual(endProperties, { endDate: "2026-03-07", endTime: "18:00" });
    assert.equal(mappedTimezone, "America/Chicago");
    return {
      scenario: "March 6–8, 2026 date-only meet; no session time and no parsed timezone",
      status: "source reconstruction exactly matches browser-reported editor values; raw model response not inspected",
      dateOnlyInputs: { start: "2026-03-06", end: "2026-03-08" },
      syntheticStartISO: parseResult.startAt, syntheticEndISO: parseResult.endAt,
      midnightIncorrectlyTreatedAsExplicitTime: hasExplicitStartTime,
      editor: { date: effectiveExisting.date, time: effectiveExisting.time, ...endProperties, timezone: mappedTimezone },
      expected: "Retain date range without inventing a session clock; derive/confirm venue timezone instead of applying Chicago to a Tampa meet.",
      causes: [
        "Date-only parsing converts dates to midnight UTC.",
        "Explicit-time detection then finds clock-shaped text within those synthetic ISO values.",
        "Start hydration reads literal UTC clock text; end hydration uses browser-local getters.",
        "A missing parsed timezone retains the shell's hard-coded America/Chicago.",
      ],
    };
  } finally {
    if (savedZone === undefined) delete process.env.TZ; else process.env.TZ = savedZone;
  }
}

const launcher = "src/components/event-create/GymnasticsLauncher.tsx";
function launcherDependencies(fetch, eventId = null) {
  const setters = {};
  const names = ["SelectedPath", "UploadBusy", "UrlBusy", "UploadProgress", "UploadStatus", "UrlProgress", "UrlStatus", "UploadError", "UrlError", "UploadFileName"];
  const state = {};
  for (const name of names) setters[`set${name}`] = value => { state[name] = value; };
  const dependencies = {
    ...setters, fetch, state,
    console: { log() {}, error() {} }, GYM_DISCOVERY_LOG_PREFIX: "[offline-gymnastics-launcher]",
    cancelRequestedRef: { current: false }, currentDiscoveryEventIdRef: { current: eventId },
    uploadXhrRef: { current: null }, ingestAbortRef: { current: null }, parseAbortRef: { current: null },
    discoveryLogStateRef: { current: { status: "", bucket: -1 } },
    selectedTemplate: null, selectedDate: "", status: "authenticated", discoveryBusy: false,
    meetUrl: "https://example.invalid/offline-meet", INGEST_REQUEST_TIMEOUT_MS: 15_000,
    window: { setTimeout, clearTimeout }, router: { push: href => { state.route = href; } },
    resolveParseTimeoutMs: () => 300_000,
    resolveGymnasticsPipelineProgress: () => ({ progress: 30, label: "Reading fixture" }),
    toDiscoveryUiError: error => ({ message: error.message, technicalDetails: null }),
    createDiscoveryStatusClientError: value => new Error(value.errorMessage || "Offline discovery failure"),
  };
  for (const name of ["toErrorMessage", "isAbortError", "abortError", "buildTimeoutError", "clearDiscoveryHandles", "requestDiscoveryCancel", "startDiscovery"])
    dependencies[name] = variable(launcher, name, dependencies);
  return dependencies;
}

async function unmountDiagnostic() {
  const calls = [];
  const dependencies = launcherDependencies(async (url, options) => {
    calls.push({ url, method: options?.method || "GET" });
    return new Response("{}", { status: 202 });
  }, "offline-in-progress-meet");
  const { ast } = source(launcher);
  const effect = find(launcher, node => ts.isCallExpression(node) &&
    node.expression.getText(ast) === "useEffect" && node.getText(ast).includes("void requestDiscoveryCancel(eventId)"));
  assert.equal(effect.arguments[1].getText(ast), "[]", "Must exercise the component lifetime cleanup");
  const cleanup = evaluate(`return (${effect.arguments[0].getText(ast)})();`, dependencies);
  cleanup();
  await Promise.resolve();
  assert.deepEqual(calls, [{ url: "/api/discovery/offline-in-progress-meet/cancel", method: "POST" }]);
  assert.equal(dependencies.currentDiscoveryEventIdRef.current, null);
  assert.equal(dependencies.cancelRequestedRef.current, true);
  return { scenario: "Unmount while an import is running; no explicit Cancel click", status: "reproduced", calls,
    impact: "Server endpoint persists cancellation and hides the unsaved import shell.",
    serverEvidence: "src/app/api/discovery/[eventId]/cancel/route.ts:31" };
}

async function retryDiagnostic() {
  const calls = [];
  let created = 0, failedStatus = false;
  const dependencies = launcherDependencies(async (url, options) => {
    calls.push({ url, method: options?.method || "GET",
      ...(options?.body ? { body: JSON.parse(options.body) } : {}) });
    if (url === "/api/discovery/intake") return Response.json({ eventId: `offline-meet-${++created}` });
    if (url.endsWith("/run")) return Response.json({ accepted: true });
    if (url.endsWith("/status")) {
      if (!failedStatus) { failedStatus = true; throw new Error("Offline transient network interruption"); }
      return Response.json({ builderReady: true, processingStage: "review_ready" });
    }
    throw new Error(`Unexpected diagnostic transport: ${url}`);
  });
  const sync = variable(launcher, "handleUrlSync", dependencies);
  await sync();
  assert.equal(dependencies.currentDiscoveryEventIdRef.current, null, "Transient failure erases the recoverable ID");
  assert.equal(dependencies.state.UrlError?.message, "Offline transient network interruption");
  await sync();
  const intakes = calls.filter(call => call.url === "/api/discovery/intake");
  assert.equal(intakes.length, 2, "Retry creates a new import rather than resuming the first one");
  assert.ok(intakes.every(call => !call.body.clientIntakeId), "Neither request supplies the durable recovery key");
  assert.ok(!calls.some(call => call.url.endsWith("/cancel")), "Ordinary failure itself does not cancel the old server work");
  assert.match(dependencies.state.route, /edit=offline-meet-2/);
  return { scenario: "One transient status-network error, then retry the same meet URL", status: "reproduced",
    calls, createdImports: created, opens: dependencies.state.route,
    impact: "The original import can continue on the server while retry creates and opens a second event." };
}

(async () => {
  const diagnostics = {
    scope: "Offline source-backed diagnostics, not end-to-end browser results",
    sourceLocations: {
      payload: location("src/app/event/gymnastics/customize/page.tsx", node => ts.isVariableDeclaration(node) && node.name.getText() === "buildEventPayload"),
      preview: location("src/app/event/gymnastics/customize/page.tsx", node => ts.isVariableDeclaration(node) && node.name.getText() === "previewEventData"),
      legacyImport: location(launcher, node => ts.isVariableDeclaration(node) && node.name.getText() === "startDiscovery"),
    },
    timezone: await timezoneDiagnostic(),
    dateOnlyMeet: await dateOnlyMeetDiagnostic(),
    unmount: await unmountDiagnostic(),
    retry: await retryDiagnostic(),
  };
  diagnostics.sourceHashes = Object.fromEntries([...sourceFiles].map(([relative, value]) =>
    [relative, crypto.createHash("sha256").update(value.text).digest("hex")]));
  process.stdout.write(JSON.stringify(diagnostics, null, 2) + "\n");
})().catch(error => { console.error(error); process.exitCode = 1; });
