import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8").replace(/\r\n/g, "\n");

test("sidebar history projections preserve product routing fields for My Events", () => {
  const source = readSource("src/lib/db.ts");
  const sidebarProjection = source.match(
    /if \(view === "sidebar"\) \{[\s\S]*?'\s*event', case[\s\S]*?end,\n\s*'signupForm'/,
  );
  assert.ok(sidebarProjection, "expected sidebar JSON projection");

  for (const token of [
    "'primaryOutput'",
    "'productType'",
    "'publicRenderer'",
    "'requestedOutputs'",
    "'outputs'",
    "'coverImageUrl'",
    "'publicEvent'",
    "'conciergeDraft'",
    "'creationSessionId'",
    "'draftStatus'",
    "'sidebarSports'",
  ]) {
    assert.ok(sidebarProjection[0].includes(token), `missing ${token}`);
  }

  const fastProjection = source.match(
    /async function listProjectedSidebarHistoryRowsByIds[\s\S]*?return \(res\.rows \|\| \[\]\)\.map\(mapSidebarProjectionRowToEventHistoryRow\);/,
  );
  assert.ok(fastProjection, "expected fast sidebar projection");
  assert.match(fastProjection[0], /eh\.public_slug/);
  assert.match(fastProjection[0], /primary_output/);
  assert.match(fastProjection[0], /requested_outputs/);
  assert.match(fastProjection[0], /public_event_primary_output/);
  assert.match(fastProjection[0], /concierge_creation_session_id/);
  assert.match(fastProjection[0], /concierge_requested_outputs/);
  assert.match(
    fastProjection[0],
    /buildSidebarSportsProjectionSql\("coalesce\(eh\.data, '\{\}'::jsonb\)"\)/,
  );
  assert.match(fastProjection[0], /draft_status/);

  const mapper = source.match(/function mapSidebarProjectionRowToEventHistoryRow[\s\S]*?\n\}/);
  assert.ok(mapper, "expected sidebar mapper");
  assert.match(mapper[0], /public_slug: row\.public_slug \|\| null/);
  assert.match(mapper[0], /primaryOutput: row\.primary_output/);
  assert.match(mapper[0], /requestedOutputs: Array\.isArray\(row\.requested_outputs\)/);
  assert.match(mapper[0], /publicEvent: buildObjectOrNull/);
  assert.match(mapper[0], /conciergeDraft: buildObjectOrNull/);
  assert.match(mapper[0], /sidebarSports: row\.sidebar_sports/);
  assert.match(mapper[0], /draftStatus: row\.draft_status/);
});

test("dashboard and general history projections preserve canonical event slugs", () => {
  const source = readSource("src/lib/db.ts");
  const dashboardProjection = source.match(
    /async function listProjectedDashboardHistoryRowsByIds[\s\S]*?return \(res\.rows \|\| \[\]\)\.map\(mapDashboardProjectionRowToEventHistoryRow\);/,
  );
  assert.ok(dashboardProjection, "expected fast dashboard projection");
  assert.match(dashboardProjection[0], /eh\.public_slug/);
  assert.match(dashboardProjection[0], /buildSidebarSportsProjectionSql/);
  assert.match(dashboardProjection[0], /draft_status/);
  assert.match(
    dashboardProjection[0],
    /jsonb_typeof\(coalesce\(eh\.data, '\{\}'::jsonb\)->'signupForm'\) = 'object'\) as has_signup_form/,
  );

  const dashboardMapper = source.match(
    /function mapDashboardProjectionRowToEventHistoryRow[\s\S]*?\n\}/,
  );
  assert.ok(dashboardMapper, "expected dashboard mapper");
  assert.match(dashboardMapper[0], /public_slug: row\.public_slug \|\| null/);
  assert.match(dashboardMapper[0], /sidebarSports: row\.sidebar_sports/);
  assert.match(dashboardMapper[0], /draftStatus: row\.draft_status/);

  const unionQuery = source.match(/function buildHistoryUnionQuery[\s\S]*?\n\}/);
  assert.ok(unionQuery, "expected shared history query");
  assert.match(unionQuery[0], /select id, user_id, title, public_slug, data, created_at/);

  const ownQuery = source.match(/function buildHistoryOwnOnlyQuery[\s\S]*?\n\}/);
  assert.ok(ownQuery, "expected owned history query");
  assert.match(ownQuery[0], /public_slug,\n\s*data,/);
});

test("dashboard fallback rows keep published signup forms in the sidebar collection", async () => {
  const { buildGroupedEventLists, countGroupedEventItems } = await import(
    "../app/left-sidebar.model.ts"
  );
  const source = ts.createSourceFile(
    "db.ts",
    readSource("src/lib/db.ts"),
    ts.ScriptTarget.Latest,
    true,
  );
  const declarations = ["buildObjectOrNull", "mapDashboardProjectionRowToEventHistoryRow"].map(
    (name) => {
      const declaration = source.statements.find(
        (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
      );
      assert.ok(declaration, `Missing ${name}`);
      return declaration.getText(source);
    },
  );
  const code = ts.transpileModule(declarations.join("\n"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const project = new Function(`${code}; return mapDashboardProjectionRowToEventHistoryRow;`)();
  const formRow = {
    id: "breakfast",
    title: "See you at the Pole",
    public_slug: "see-you-at-the-pole-at-upper-school-campus",
    has_signup_form: true,
    ownership: "owned",
    status: "published",
    start_iso: "2200-09-23T07:00:00",
  };
  const history = [
    formRow,
    { ...formRow, id: "draft", status: "draft" },
    { ...formRow, id: "invited", ownership: "invited" },
    { ...formRow, id: "event", has_signup_form: false },
  ].map(project);
  const lists = buildGroupedEventLists({
    history,
    getEventStartIso: (data) => data.startISO,
    buildEventPath: (id) => `/event/${id}`,
    isSportsPreviewFirstEvent: () => false,
    isInvitedEventLikeRecord: (data) => data.ownership === "invited",
    canShowOwnerRsvpDashboard: () => false,
  });
  assert.equal(countGroupedEventItems(lists.signupForms.upcoming), 1);
  const item = lists.signupForms.upcoming.flatMap((section) => section.items)[0];
  assert.equal(item.row.id, "breakfast");
  assert.equal(item.ownerHref, "/smart-signup-form/see-you-at-the-pole-at-upper-school-campus");
  assert.deepEqual(
    history[0].data.signupForm.responses,
    [],
    "sidebar data never needs participant details",
  );
  assert.equal(
    lists.myEvents.upcoming
      .flatMap((section) => section.items)
      .some((entry) => entry.row.id === "breakfast"),
    false,
  );
});
