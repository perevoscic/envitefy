import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

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

  const mapper = source.match(/function mapSidebarProjectionRowToEventHistoryRow[\s\S]*?\n\}/);
  assert.ok(mapper, "expected sidebar mapper");
  assert.match(mapper[0], /public_slug: row\.public_slug \|\| null/);
  assert.match(mapper[0], /primaryOutput: row\.primary_output/);
  assert.match(mapper[0], /requestedOutputs: Array\.isArray\(row\.requested_outputs\)/);
  assert.match(mapper[0], /publicEvent: buildObjectOrNull/);
  assert.match(mapper[0], /conciergeDraft: buildObjectOrNull/);
});

test("dashboard and general history projections preserve canonical event slugs", () => {
  const source = readSource("src/lib/db.ts");
  const dashboardProjection = source.match(
    /async function listProjectedDashboardHistoryRowsByIds[\s\S]*?return \(res\.rows \|\| \[\]\)\.map\(mapDashboardProjectionRowToEventHistoryRow\);/,
  );
  assert.ok(dashboardProjection, "expected fast dashboard projection");
  assert.match(dashboardProjection[0], /eh\.public_slug/);

  const dashboardMapper = source.match(
    /function mapDashboardProjectionRowToEventHistoryRow[\s\S]*?\n\}/,
  );
  assert.ok(dashboardMapper, "expected dashboard mapper");
  assert.match(dashboardMapper[0], /public_slug: row\.public_slug \|\| null/);

  const unionQuery = source.match(/function buildHistoryUnionQuery[\s\S]*?\n\}/);
  assert.ok(unionQuery, "expected shared history query");
  assert.match(unionQuery[0], /select id, user_id, title, public_slug, data, created_at/);

  const ownQuery = source.match(/function buildHistoryOwnOnlyQuery[\s\S]*?\n\}/);
  assert.ok(ownQuery, "expected owned history query");
  assert.match(ownQuery[0], /public_slug,\n\s*data,/);
});
