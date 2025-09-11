import { Pool, PoolClient, QueryResult, type QueryResultRow } from "pg";
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
const scrypt = promisify(nodeScrypt);

type NonEmptyString = string & { _brand: "NonEmptyString" };

function assertEnv(name: string, value: string | undefined): asserts value is NonEmptyString {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not set`);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__pgPool) {
    const databaseUrl = process.env.DATABASE_URL as string | undefined;
    assertEnv("DATABASE_URL", databaseUrl);
    // Build SSL config based on env. Do exactly one of:
    // - PGSSL_DISABLE_VERIFY=true => ssl: { rejectUnauthorized: false }
    // - PGSSL_CA_BASE64 set       => ssl: { ca, rejectUnauthorized: true }
    // - otherwise: do not set ssl here (allow DATABASE_URL to determine)
    let ssl: { rejectUnauthorized: boolean; ca?: string } | undefined;
    const disableVerify = (process.env.PGSSL_DISABLE_VERIFY || "").toLowerCase();
    const caBase64 = process.env.PGSSL_CA_BASE64 as string | undefined;
    if (disableVerify === "1" || disableVerify === "true") {
      ssl = { rejectUnauthorized: false };
    } else if (caBase64 && caBase64.trim().length > 0) {
      try {
        const ca = Buffer.from(caBase64, "base64").toString("utf8");
        ssl = { rejectUnauthorized: true, ca };
      } catch {
        ssl = undefined;
      }
    }

    // If we are passing an explicit ssl object, strip sslmode/ssl params from the URL
    // to avoid conflicts, since constructor options should be the single source of truth.
    let connectionStringToUse: string = databaseUrl;
    if (ssl) {
      try {
        const url = new URL(databaseUrl);
        url.searchParams.delete("sslmode");
        url.searchParams.delete("ssl");
        connectionStringToUse = url.toString();
      } catch {
        // If URL parsing fails, fall back to original string
        connectionStringToUse = databaseUrl;
      }
    }

    const poolConfig: any = { connectionString: connectionStringToUse, max: 10 };
    // Timeouts to prevent hanging requests causing upstream 504s
    const connectTimeoutMs = Number.parseInt(process.env.PG_CONNECT_TIMEOUT_MS || "5000", 10);
    const idleTimeoutMs = Number.parseInt(process.env.PG_IDLE_TIMEOUT_MS || "10000", 10);
    const statementTimeoutMs = Number.parseInt(process.env.PG_STATEMENT_TIMEOUT_MS || "15000", 10);
    if (Number.isFinite(connectTimeoutMs)) poolConfig.connectionTimeoutMillis = connectTimeoutMs;
    if (Number.isFinite(idleTimeoutMs)) poolConfig.idleTimeoutMillis = idleTimeoutMs;
    poolConfig.keepAlive = true;
    poolConfig.allowExitOnIdle = false;
    if (ssl) poolConfig.ssl = ssl;
    global.__pgPool = new Pool(poolConfig);
    // Ensure long queries also timeout server-side
    try {
      const timeoutValue = Math.max(1000, statementTimeoutMs);
      global.__pgPool.on("connect", (client: PoolClient) => {
        // Not awaited; best-effort. Sets statement_timeout for the session.
        client.query(`SET statement_timeout TO ${timeoutValue}`);
      });
    } catch {
      // ignore
    }
  }
  return global.__pgPool;
}

async function withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: any[] = []): Promise<QueryResult<T>> {
  return withClient((client) => client.query<T>(text, params));
}

export type AppUserRow = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  preferred_provider?: string | null;
  subscription_plan?: string | null;
  password_hash: string;
  created_at?: string;
};

export async function getUserByEmail(email: string): Promise<AppUserRow | null> {
  const lower = email.toLowerCase();
  const res = await query<AppUserRow>(
    `select id, email, first_name, last_name, preferred_provider, subscription_plan, password_hash, created_at
     from users
     where email = $1
     limit 1`,
    [lower]
  );
  return res.rows[0] || null;
}

export async function createUserWithEmailPassword(params: {
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
}): Promise<AppUserRow> {
  const { email, firstName, lastName, password } = params;
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("Account already exists for this email");
  const password_hash = await hashPassword(password);
  const lower = email.toLowerCase();
  const res = await query<AppUserRow>(
    `insert into users (email, first_name, last_name, password_hash)
     values ($1, $2, $3, $4)
     returning id, email, first_name, last_name, preferred_provider, subscription_plan, password_hash, created_at`,
    [lower, firstName || null, lastName || null, password_hash]
  );
  return res.rows[0];
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [saltHex, keyHex] = passwordHash.split(":");
  if (!saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const storedKey = Buffer.from(keyHex, "hex");
  const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;
  return timingSafeEqual(storedKey, derivedKey);
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const lower = email.toLowerCase();
  const res = await query<{ id: string }>(`select id from users where email = $1 limit 1`, [lower]);
  return res.rows[0]?.id || null;
}

// handle-based helpers removed per revert

export async function saveMicrosoftRefreshToken(email: string, refreshToken: string): Promise<void> {
  const lower = email.toLowerCase();
  const userId = await getUserIdByEmail(lower);
  await query(
    `insert into oauth_tokens (email, provider, refresh_token, user_id)
     values ($1, 'microsoft', $2, $3)
     on conflict (email, provider)
     do update set refresh_token = excluded.refresh_token,
                   user_id = coalesce(excluded.user_id, oauth_tokens.user_id),
                   updated_at = now()`,
    [lower, refreshToken, userId]
  );
}

export async function getMicrosoftRefreshToken(email: string): Promise<string | null> {
  const lower = email.toLowerCase();
  const userId = await getUserIdByEmail(lower);
  if (userId) {
    const res = await query<{ refresh_token: string }>(
      `select refresh_token from oauth_tokens where provider = 'microsoft' and user_id = $1 limit 1`,
      [userId]
    );
    if (res.rows[0]?.refresh_token) return res.rows[0].refresh_token;
  }
  const res = await query<{ refresh_token: string }>(
    `select refresh_token from oauth_tokens where provider = 'microsoft' and email = $1 limit 1`,
    [lower]
  );
  return res.rows[0]?.refresh_token || null;
}

export async function saveGoogleRefreshToken(email: string, refreshToken: string): Promise<void> {
  const lower = email.toLowerCase();
  const userId = await getUserIdByEmail(lower);
  await query(
    `insert into oauth_tokens (email, provider, refresh_token, user_id)
     values ($1, 'google', $2, $3)
     on conflict (email, provider)
     do update set refresh_token = excluded.refresh_token,
                   user_id = coalesce(excluded.user_id, oauth_tokens.user_id),
                   updated_at = now()`,
    [lower, refreshToken, userId]
  );
}

export async function getGoogleRefreshToken(email: string): Promise<string | null> {
  const lower = email.toLowerCase();
  const userId = await getUserIdByEmail(lower);
  if (userId) {
    const res = await query<{ refresh_token: string }>(
      `select refresh_token from oauth_tokens where provider = 'google' and user_id = $1 limit 1`,
      [userId]
    );
    if (res.rows[0]?.refresh_token) return res.rows[0].refresh_token;
  }
  const res = await query<{ refresh_token: string }>(
    `select refresh_token from oauth_tokens where provider = 'google' and email = $1 limit 1`,
    [lower]
  );
  return res.rows[0]?.refresh_token || null;
}


// removed deleteProviderRefreshTokenByEmail helper (undo)


export async function updateUserNamesByEmail(params: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}): Promise<AppUserRow> {
  const lower = params.email.toLowerCase();
  const existing = await getUserByEmail(lower);
  if (!existing) {
    throw new Error("No local account found for this email");
  }
  const res = await query<AppUserRow>(
    `update users
     set first_name = $2, last_name = $3
     where email = $1
     returning id, email, first_name, last_name, preferred_provider, subscription_plan, password_hash, created_at`,
    [lower, params.firstName ?? null, params.lastName ?? null]
  );
  return res.rows[0];
}

export async function updatePreferredProviderByEmail(params: {
  email: string;
  preferredProvider: "google" | "microsoft" | "apple" | null;
}): Promise<AppUserRow> {
  const lower = params.email.toLowerCase();
  const existing = await getUserByEmail(lower);
  if (!existing) {
    throw new Error("No local account found for this email");
  }
  const res = await query<AppUserRow>(
    `update users
     set preferred_provider = $2
     where email = $1
     returning id, email, first_name, last_name, preferred_provider, subscription_plan, password_hash, created_at`,
    [lower, params.preferredProvider]
  );
  return res.rows[0];
}

export async function changePasswordByEmail(params: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const lower = params.email.toLowerCase();
  const user = await getUserByEmail(lower);
  if (!user) throw new Error("No local account found for this email");
  const ok = await verifyPassword(params.currentPassword, user.password_hash);
  if (!ok) throw new Error("Current password is incorrect");
  const newHash = await hashPassword(params.newPassword);
  await query(
    `update users set password_hash = $2 where email = $1`,
    [lower, newHash]
  );
}

export async function setPasswordByEmail(params: { email: string; newPassword: string }): Promise<void> {
  const lower = params.email.toLowerCase();
  const user = await getUserByEmail(lower);
  if (!user) throw new Error("No local account found for this email");
  const newHash = await hashPassword(params.newPassword);
  await query(`update users set password_hash = $2 where email = $1`, [lower, newHash]);
}

async function ensureUsersHasSubscriptionPlanColumn(): Promise<void> {
  await query(`alter table users add column if not exists subscription_plan varchar(32)`);
}

export type SubscriptionPlan = "free" | "monthly" | "yearly";

export async function getSubscriptionPlanByEmail(email: string): Promise<string | null> {
  await ensureUsersHasSubscriptionPlanColumn();
  const lower = email.toLowerCase();
  const res = await query<{ subscription_plan: string | null }>(
    `select subscription_plan from users where email = $1 limit 1`,
    [lower]
  );
  return (res.rows[0]?.subscription_plan as string | null) ?? null;
}

export async function updateSubscriptionPlanByEmail(params: {
  email: string;
  plan: SubscriptionPlan | null;
}): Promise<void> {
  await ensureUsersHasSubscriptionPlanColumn();
  const lower = params.email.toLowerCase();
  await query(`update users set subscription_plan = $2 where email = $1`, [lower, params.plan]);
}

// Promo codes
export type PromoCodeRow = {
  id: string;
  code: string;
  amount_cents: number;
  currency: string;
  created_by_email?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  message?: string | null;
  expires_at?: string | null;
  redeemed_at?: string | null;
  created_at?: string | null;
};

function generatePromoCode(length: number = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let out = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export async function createGiftPromoCode(params: {
  amountCents: number;
  currency?: string;
  createdByEmail?: string | null;
  recipientName?: string | null;
  recipientEmail?: string | null;
  message?: string | null;
  expiresAt?: Date | null;
}): Promise<PromoCodeRow> {
  const code = generatePromoCode(12);
  const res = await query<PromoCodeRow>(
    `insert into promo_codes (code, amount_cents, currency, created_by_email, recipient_name, recipient_email, message, expires_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id, code, amount_cents, currency, created_by_email, recipient_name, recipient_email, message, expires_at, redeemed_at, created_at`,
    [
      code,
      Math.max(0, Math.floor(params.amountCents || 0)),
      (params.currency || "USD").toUpperCase(),
      params.createdByEmail || null,
      params.recipientName || null,
      params.recipientEmail || null,
      params.message || null,
      params.expiresAt ? params.expiresAt.toISOString() : null,
    ]
  );
  return res.rows[0];
}

export async function getPromoCodeByCode(code: string): Promise<PromoCodeRow | null> {
  const res = await query<PromoCodeRow>(
    `select id, code, amount_cents, currency, created_by_email, recipient_name, recipient_email, message, expires_at, redeemed_at, created_at
     from promo_codes where code = $1 limit 1`,
    [code]
  );
  return res.rows[0] || null;
}

export async function markPromoCodeRedeemed(id: string): Promise<void> {
  await query(`update promo_codes set redeemed_at = now() where id = $1 and redeemed_at is null`, [id]);
}

// Event history
export type EventHistoryRow = {
  id: string;
  user_id?: string | null;
  title: string;
  data: any;
  created_at?: string;
};

export async function insertEventHistory(params: {
  userId?: string | null;
  title: string;
  data: any;
}): Promise<EventHistoryRow> {
  const res = await query<EventHistoryRow>(
    `insert into event_history (user_id, title, data)
     values ($1, $2, $3)
     returning id, user_id, title, data, created_at`,
    [params.userId || null, params.title, JSON.stringify(params.data)]
  );
  return res.rows[0];
}

export async function getEventHistoryById(id: string): Promise<EventHistoryRow | null> {
  const res = await query<EventHistoryRow>(
    `select id, user_id, title, data, created_at
     from event_history
     where id = $1
     limit 1`,
    [id]
  );
  return res.rows[0] || null;
}

export async function updateEventHistoryTitle(id: string, title: string): Promise<EventHistoryRow | null> {
  const res = await query<EventHistoryRow>(
    `update event_history
     set title = $2
     where id = $1
     returning id, user_id, title, data, created_at`,
    [id, title]
  );
  return res.rows[0] || null;
}

export async function deleteEventHistoryById(id: string): Promise<void> {
  await query(`delete from event_history where id = $1`, [id]);
}

function slugifyTitleForQuery(title: string): string {
  return (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getEventHistoryByUserAndSlug(userId: string, slug: string): Promise<EventHistoryRow | null> {
  // Fetch a handful of recent events and match by slug server-side to avoid DB funcs
  const res = await query<EventHistoryRow>(
    `select id, user_id, title, data, created_at
     from event_history
     where user_id = $1
     order by created_at desc
     limit 200`,
    [userId]
  );
  const rows = res.rows || [];
  const target = slug.toLowerCase();
  for (const r of rows) {
    const s = slugifyTitleForQuery(r.title || "");
    if (s && s === target) return r;
  }
  return null;
}

/**
 * Resolve an event by either a UUID id, a plain slug, or a combined slug-id value ("my-event-title-<uuid>").
 * - If `userId` is provided and a plain slug is passed, we attempt to match against recent user events for stability.
 */
export async function getEventHistoryBySlugOrId(params: {
  value: string;
  userId?: string | null;
}): Promise<EventHistoryRow | null> {
  const raw = (params.value || "").trim();
  if (!raw) return null;

  const maybeUuid = raw.replace(/^.*-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i, "$1");
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw);
  const endsWithUuid = /^[\w-]*-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw);

  if (isUuid) {
    return await getEventHistoryById(raw);
  }
  if (endsWithUuid) {
    return await getEventHistoryById(maybeUuid);
  }

  const slug = slugifyTitleForQuery(raw);
  if (!slug) return null;
  if (params.userId) {
    const row = await getEventHistoryByUserAndSlug(params.userId, slug);
    if (row) return row;
  }
  // Fallback: try a broader search across recent events for any user (limited)
  const res = await query<EventHistoryRow>(
    `select id, user_id, title, data, created_at
     from event_history
     order by created_at desc
     limit 500`
  );
  const rows = res.rows || [];
  for (const r of rows) {
    const s = slugifyTitleForQuery(r.title || "");
    if (s && s === slug) return r;
  }
  return null;
}

export async function listEventHistoryByUser(userId: string, limit: number = 50): Promise<EventHistoryRow[]> {
  const res = await query<EventHistoryRow>(
    `select id, user_id, title, data, created_at
     from event_history
     where user_id = $1
     order by created_at desc
     limit $2`,
    [userId, Math.max(1, Math.min(200, limit))]
  );
  return res.rows;
}

export type PasswordResetRow = {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at?: string | null;
  created_at?: string;
};

function generateSecureToken(bytes: number = 32): string {
  return randomBytes(bytes).toString("hex");
}

export async function createPasswordResetToken(email: string, ttlMinutes = 30): Promise<PasswordResetRow> {
  const lower = email.toLowerCase();
  const user = await getUserByEmail(lower);
  if (!user) throw new Error("No account found for this email");
  const token = generateSecureToken(32);
  const expires = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const res = await query<PasswordResetRow>(
    `insert into password_resets (email, token, expires_at)
     values ($1, $2, $3)
     returning id, email, token, expires_at, used_at, created_at`,
    [lower, token, expires.toISOString()]
  );
  return res.rows[0];
}

export async function getValidPasswordResetByToken(token: string): Promise<PasswordResetRow | null> {
  const res = await query<PasswordResetRow>(
    `select id, email, token, expires_at, used_at, created_at
     from password_resets
     where token = $1
     limit 1`,
    [token]
  );
  const row = res.rows[0];
  if (!row) return null;
  if (row.used_at) return null;
  const expires = new Date(row.expires_at).getTime();
  if (isNaN(expires) || expires < Date.now()) return null;
  return row;
}

export async function markPasswordResetUsed(id: string): Promise<void> {
  await query(`update password_resets set used_at = now() where id = $1`, [id]);
}
