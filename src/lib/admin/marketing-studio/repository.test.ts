import assert from "node:assert/strict";
import test from "node:test";
import type { QueryResultRow } from "pg";
import { createStudioRepository, type StudioQuery } from "./repository.ts";
import { DEFAULT_STUDIO_SETTINGS, type StudioTurnInput } from "./types.ts";

const conversationId = "10000000-0000-4000-8000-000000000001";
const versionId = "20000000-0000-4000-8000-000000000002";
const requestId = "30000000-0000-4000-8000-000000000003";
const input: StudioTurnInput = {
  clientRequestId: requestId,
  text: "A quiet celebration",
  settings: DEFAULT_STUDIO_SETTINGS,
  parentVersionId: null,
  referenceAssetIds: [],
};
const versionRow = {
  id: versionId,
  conversation_id: conversationId,
  parent_version_id: null,
  output: "image",
  status: "queued",
  input,
  result: null,
  provider: {},
  error: null,
  created_at: new Date("2026-09-04T12:00:00Z"),
  updated_at: new Date("2026-09-04T12:00:00Z"),
};

function fixture(steps: QueryResultRow[][]) {
  const calls: Array<{ sql: string; parameters: Parameters<StudioQuery>[1] }> = [];
  const execute: StudioQuery = async <Row extends QueryResultRow>(
    sql: string,
    parameters: Parameters<StudioQuery>[1] = [],
  ) => {
    calls.push({ sql, parameters });
    assert.ok(steps.length, "Unexpected database operation");
    const rows = steps.shift() as Row[];
    return { rows, rowCount: rows.length };
  };
  return { repository: createStudioRepository(execute), calls, steps };
}

test("a repeated client request returns its saved version without creating a second conversation turn", async () => {
  const { repository, calls } = fixture([[], [{ ...versionRow, same_input: true }]]);
  const version = await repository.createTurn(conversationId, "admin@example.test", input);
  assert.equal(version.id, versionId);
  assert.equal(version.createdAt, "2026-09-04T12:00:00.000Z");
  assert.equal(calls.length, 2);
  assert.match(calls[0].sql, /with inserted as/);
  assert.match(calls[0].sql, /on conflict \(conversation_id, client_request_id\) do nothing/);
  assert.match(calls[0].sql, /from inserted/);
});

test("a reused request ID with changed content is rejected instead of silently returning unrelated output", async () => {
  const { repository } = fixture([[], [{ ...versionRow, same_input: false }]]);
  await assert.rejects(
    repository.createTurn(conversationId, "admin@example.test", input),
    /different content/,
  );
});

test("cross-conversation parent or reference assets are rejected before creation", async () => {
  const parent = fixture([[{ ...versionRow, conversation_id: requestId }]]);
  await assert.rejects(
    parent.repository.createTurn(conversationId, "admin@example.test", {
      ...input,
      parentVersionId: versionId,
    }),
    /does not belong/,
  );
  assert.equal(parent.calls.length, 1);
  const references = fixture([[]]);
  await assert.rejects(
    references.repository.createTurn(conversationId, "admin@example.test", {
      ...input,
      referenceAssetIds: versionId.split(","),
    }),
    /must belong/,
  );
  assert.equal(references.calls.length, 1);
});

test("expired ambiguous submissions are isolated before any new lease can be granted", async () => {
  const { repository, calls } = fixture([[], []]);
  assert.equal(await repository.claimVersion(versionId), null);
  assert.match(calls[0].sql, /status = 'submission_unknown'/);
  assert.match(calls[0].sql, /v.status = 'submitting'/);
  assert.doesNotMatch(calls[1].sql, /status in \([^)]*'submitting'/);
  assert.match(calls[1].sql, /v.lease_until < now\(\)/);
});

test("lost leases cannot overwrite another worker and release=false renews ownership", async () => {
  const { repository, calls } = fixture([[]]);
  assert.equal(
    await repository.updateClaimedVersion(
      versionId,
      requestId,
      { status: "running", provider: { interactionId: "operation-one" } },
      false,
    ),
    false,
  );
  assert.equal(calls[0].parameters?.[10], false);
  assert.match(calls[0].sql, /v.lease_token = \$2::uuid/);
  assert.match(calls[0].sql, /thread_type = 'admin_marketing'/);
});

test("recoverable failed work resumes its saved operation without queueing a new generation", async () => {
  const { repository, calls } = fixture([
    [
      {
        ...versionRow,
        status: "running",
        provider: { interactionId: "saved-operation", attempts: 0 },
      },
    ],
  ]);
  const version = await repository.retryVersion(versionId);
  assert.equal(version.status, "running");
  assert.equal(version.provider.interactionId, "saved-operation");
  assert.doesNotMatch(calls[0].sql, /'queued'/);
  assert.match(calls[0].sql, /rawAssetId/);
});

test("ambiguous or rejected generation requires an explicit new version", async () => {
  const { repository } = fixture([[], [{ ...versionRow, status: "submission_unknown" }]]);
  await assert.rejects(repository.retryVersion(versionId), /Create a new version/);
});

test("the first completed version gets a short generated title without replacing renamed or later-version titles", async () => {
  const { repository, calls } = fixture([[{ id: versionId }]]);
  const headline = "Everyone's together";
  await repository.updateClaimedVersion(versionId, requestId, {
    status: "ready",
    result: {
      prompt: "An image",
      direction: "A warm invitation",
      caption: "Celebrate together",
      headline,
    },
  });
  assert.match(calls[0].sql, /title = case when v.status = 'ready'/);
  assert.match(calls[0].sql, /t.title = 'New creation' or t.title = left\(v.input->>'text', 80\)/);
  assert.match(calls[0].sql, /order by initial.created_at, initial.id limit 1/);
  assert.match(calls[0].sql, /left\(btrim\(v.result->>'headline'\), 80\) else t.title/);
  assert.doesNotMatch(calls[0].sql, /Everyone's together/);
  assert.match(String(calls[0].parameters?.[4]), /Everyone's together/);
});

test("provider snapshots can clear expired download URIs while omitted provider updates preserve state", async () => {
  const { repository, calls } = fixture([[{ id: versionId }], [{ id: versionId }]]);
  await repository.updateClaimedVersion(
    versionId,
    requestId,
    {
      provider: { interactionId: "saved-operation", videoUri: undefined, attempts: 2 },
    },
    false,
  );
  assert.deepEqual(JSON.parse(String(calls[0].parameters?.[5])), {
    interactionId: "saved-operation",
    attempts: 2,
  });
  assert.match(
    calls[0].sql,
    /provider = case when \$6::jsonb is null then v.provider else \$6::jsonb end/,
  );
  await repository.updateClaimedVersion(versionId, requestId, { error: null });
  assert.equal(calls[1].parameters?.[5], null);
});
