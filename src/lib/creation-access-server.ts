import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getEventDiscoveryByEventId, getEventHistoryById, query, withClient, type EventHistoryRow } from "@/lib/db";
import { getEventPermissions } from "@/lib/event-collaboration";
import { approvedCreationPreferences, creationAllowed, eventCreationRequirement, normalizeCreationCategory, normalizeCreationProduct, resolveCreationAccess, type CreationAccess, type CreationProduct } from "./creation-access";

const CREATION_ACCESS_SCHEMA = `CREATE TABLE IF NOT EXISTS creation_account_access (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    policy text NOT NULL DEFAULT 'standard' CHECK(policy IN ('standard','restricted')),
    categories text[] NOT NULL DEFAULT '{}', products text[] NOT NULL DEFAULT '{}',
    updated_by text, updated_at timestamptz NOT NULL DEFAULT now()
  ); CREATE TABLE IF NOT EXISTS creation_access_requests (
    id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind text NOT NULL CHECK(kind IN ('category','product')), capability text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','declined')),
    created_at timestamptz NOT NULL DEFAULT now(), reviewed_by text, reviewed_at timestamptz
  ); CREATE UNIQUE INDEX IF NOT EXISTS creation_access_requests_pending ON creation_access_requests(user_id,kind,capability) WHERE status='pending';
  ALTER TABLE creation_account_access ENABLE ROW LEVEL SECURITY;
  ALTER TABLE creation_access_requests ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON TABLE creation_account_access,creation_access_requests FROM PUBLIC;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON TABLE creation_account_access,creation_access_requests FROM anon; END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON TABLE creation_account_access,creation_access_requests FROM authenticated; END IF;
  END $$;`;

let schema: Promise<void> | undefined;
export function ensureCreationAccessSchema(): Promise<void> {
  schema ||= withClient(async (client) => {
    // Cold workers must not repeat ALTER TABLE's exclusive locks on a migrated
    // database while other requests are reading the account's current grants.
    const ready = await client.query<{ ready: boolean }>(`
      SELECT count(*) = 2 AND bool_and(c.relrowsecurity AND NOT EXISTS (
        SELECT 1 FROM aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) grants
        LEFT JOIN pg_roles r ON r.oid = grants.grantee
        WHERE grants.grantee = 0 OR r.rolname IN ('anon', 'authenticated')
      )) AND to_regclass('public.creation_access_requests_pending') IS NOT NULL AS ready
      FROM pg_class c WHERE c.oid IN (
        to_regclass('public.creation_account_access'),
        to_regclass('public.creation_access_requests'))`);
    if (ready.rows[0]?.ready) return;
    await client.query("BEGIN");
    try {
      await client.query(CREATION_ACCESS_SCHEMA);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }).catch((error) => { schema = undefined; throw error; });
  return schema;
}
export class CreationAccessError extends Error {
  status = 403;
  code = "CREATION_ACCESS_REQUIRED";
  constructor(message = "Request access to this event type in Settings. Your source and edits are kept here.") { super(message); }
}
export function creationAccessErrorResponse(error: unknown): NextResponse | null {
  return error instanceof CreationAccessError ? NextResponse.json({ error: error.message, code: error.code }, { status: error.status }) : null;
}
export async function getCreationAccess(userId: string): Promise<CreationAccess> {
  await ensureCreationAccessSchema();
  return resolveCreationAccess((await query("SELECT policy,categories,products FROM creation_account_access WHERE user_id=$1", [userId])).rows[0]);
}
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
/** Only an event_discoveries source record may supply this server authorization stamp. */
export async function requireDiscoveryCreationAccess(event: EventHistoryRow, source: unknown, actorUserId: string) {
  if (!event.user_id || !(await getEventPermissions(event, actorUserId)).canEdit) throw new CreationAccessError("You no longer have editing access to this event.");
  const stampValue = record(source).creationAuthorization;
  if (stampValue == null) return; // Pre-release saved events retain their existing membership access.
  const stamp = record(stampValue);
  const category = normalizeCreationCategory(stamp.category);
  if (stamp.version !== 1 || stamp.product !== "event_page" || stamp.userId !== event.user_id || !category || typeof stamp.authorizedAt !== "string") throw new CreationAccessError("This import's creation access could not be verified. Your source is kept; start a new import to continue.");
  // The first explicit authorized save records savedAt in the protected discovery
  // row. Client-writable event flags cannot turn an unsaved shell into an exemption.
  if (typeof stamp.savedAt === "string" && Number.isFinite(Date.parse(stamp.savedAt))) return;
  await requireCreationAccess(actorUserId, { product: "event_page", category });
}
export async function checkDiscoveryCreationSaveAccess(userId: string, event: EventHistoryRow, nextData: unknown) {
  try {
    const discovery = await getEventDiscoveryByEventId(event.id);
    if (!record(discovery?.source).creationAuthorization) return null;
    await requireDiscoveryCreationAccess(event, discovery!.source, userId);
    const stamp = record(record(discovery!.source).creationAuthorization);
    if (!(typeof stamp.savedAt === "string" && Number.isFinite(Date.parse(stamp.savedAt)))) await requireEventCreationAccess(userId, nextData);
    return null;
  } catch (error) { return creationAccessErrorResponse(error) || NextResponse.json({ error: "Could not verify this import's creation access. Your source and edits are kept here." }, { status: 503 }); }
}
export async function markDiscoveryCreationSaved(eventId: string, ownerId: string | null) {
  // This updates only the server stamp; a slow worker cannot overwrite it with
  // stale source metadata because updateEventDiscovery preserves that field.
  await query(`UPDATE event_discoveries SET source=jsonb_set(source,'{creationAuthorization,savedAt}',to_jsonb(now()::text),true),updated_at=now()
    WHERE event_id=$1 AND source#>>'{creationAuthorization,userId}'=$2
      AND source#>>'{creationAuthorization,version}'='1'
      AND source#>>'{creationAuthorization,product}'='event_page'
      AND source#>>'{creationAuthorization,savedAt}' IS NULL`, [eventId, ownerId]);
}
/** Existing-event operations use current event membership, never menu or new-create grants. */
export async function requireCreationAccess(userId: string, operation: { product: CreationProduct; category?: unknown; categories?: unknown[]; eventId?: string | null }) {
  const requestedCategories = [...(operation.category == null ? [] : [operation.category]), ...(operation.categories || [])];
  if (operation.eventId) {
    const event = await getEventHistoryById(operation.eventId);
    if (!event || !(await getEventPermissions(event, userId)).canEdit) throw new CreationAccessError("You no longer have editing access to this event.");
    const discovery = await getEventDiscoveryByEventId(event.id);
    if (discovery) await requireDiscoveryCreationAccess(event, discovery.source, userId);
    const requirement = eventCreationRequirement(event.data);
    if (requirement.product !== operation.product && !(requirement.product === "snap" && operation.product === "event_page")) throw new CreationAccessError("Open the saved event in its existing editor to continue.");
    if (requestedCategories.some((category) => { const requested = normalizeCreationCategory(category); return !requested || !requirement.categories.includes(requested); })) throw new CreationAccessError("This event type does not match the saved event. Open its editor to continue.");
    return;
  }
  const access = await getCreationAccess(userId);
  if (!creationAllowed(access, operation.product) || requestedCategories.some((category) => !creationAllowed(access, operation.product, category))) throw new CreationAccessError();
}
export async function requireEventCreationAccess(userId: string, data: unknown) {
  const requirement = eventCreationRequirement(data);
  const access = await getCreationAccess(userId);
  if (!creationAllowed(access, requirement.product) || requirement.categories.some((category) => !access.allowedCategories.includes(category))) throw new CreationAccessError();
}
export async function checkCreationAccess(userId: string, operation: Parameters<typeof requireCreationAccess>[1]) {
  try { await requireCreationAccess(userId, operation); return null; }
  catch (error) { return creationAccessErrorResponse(error) || NextResponse.json({ error: "Could not verify your account access. Your source and edits are kept here." }, { status: 503 }); }
}
export async function checkEventCreationAccess(userId: string, data: unknown) {
  try { await requireEventCreationAccess(userId, data); return null; }
  catch (error) { return creationAccessErrorResponse(error) || NextResponse.json({ error: "Could not verify your account access. Your source and edits are kept here." }, { status: 503 }); }
}
export async function listCreationAccessRequests(userId?: string) {
  await ensureCreationAccessSchema();
  return (await query(`SELECT r.*,u.email FROM creation_access_requests r JOIN users u ON u.id=r.user_id ${userId ? "WHERE r.user_id=$1" : "WHERE r.status='pending'"} ORDER BY r.created_at DESC LIMIT 100`, userId ? [userId] : [])).rows;
}
export async function requestCreationAccess(userId: string, kind: unknown, capability: unknown) {
  const key = kind === "category" ? normalizeCreationCategory(capability) : kind === "product" ? normalizeCreationProduct(capability) : null;
  if (!key) throw new Error("Choose a released event type or product.");
  await ensureCreationAccessSchema();
  await query(`INSERT INTO creation_access_requests(id,user_id,kind,capability) VALUES($1,$2,$3,$4)
    ON CONFLICT(user_id,kind,capability) WHERE status='pending' DO NOTHING`, [randomUUID(), userId, kind, key]);
}
export async function updateCreationAccountAccess(email: string, policy: unknown, categories: unknown, products: unknown, reviewer: string) {
  if (policy !== "standard" && policy !== "restricted") throw new Error("Choose Standard or Restricted access.");
  const access = resolveCreationAccess({ policy: "restricted", categories, products });
  await ensureCreationAccessSchema();
  const result = await query(`INSERT INTO creation_account_access(user_id,policy,categories,products,updated_by)
    SELECT id,$2,$3::text[],$4::text[],$5 FROM users WHERE lower(email)=lower($1)
    ON CONFLICT(user_id) DO UPDATE SET policy=EXCLUDED.policy,categories=EXCLUDED.categories,products=EXCLUDED.products,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING user_id`, [email, policy, access.allowedCategories, access.allowedProducts, reviewer]);
  if (!result.rows.length) throw new Error("Account not found.");
}
export async function reviewCreationAccessRequest(id: string, decision: unknown, reviewer: string) {
  if (decision !== "approved" && decision !== "declined") throw new Error("Choose Approve or Decline.");
  await ensureCreationAccessSchema();
  await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const request = (await client.query("SELECT * FROM creation_access_requests WHERE id=$1 FOR UPDATE", [id])).rows[0];
      if (request?.status !== "pending") throw new Error("This request has already been reviewed or is unavailable.");
      if (decision === "approved") {
        await client.query("INSERT INTO creation_account_access(user_id) VALUES($1) ON CONFLICT DO NOTHING", [request.user_id]);
        await client.query(`UPDATE creation_account_access SET
          categories=CASE WHEN $2='category' AND NOT ($3=ANY(categories)) THEN array_append(categories,$3) ELSE categories END,
          products=CASE WHEN $2='product' AND NOT ($3=ANY(products)) THEN array_append(products,$3)
            WHEN $2='category' AND NOT ('event_page'=ANY(products)) THEN array_append(products,'event_page') ELSE products END,
          updated_by=$4,updated_at=now() WHERE user_id=$1`, [request.user_id, request.kind, request.capability, reviewer]);
        const user = (await client.query("SELECT feature_visibility FROM users WHERE id=$1 FOR UPDATE", [request.user_id])).rows[0];
        await client.query("UPDATE users SET feature_visibility=$2::jsonb WHERE id=$1", [request.user_id, JSON.stringify(approvedCreationPreferences(user?.feature_visibility, request.kind, request.capability))]);
      }
      await client.query("UPDATE creation_access_requests SET status=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$1", [id, decision, reviewer]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  });
}
