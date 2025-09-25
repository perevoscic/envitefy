import { Pool, PoolClient, QueryResult, type QueryResultRow } from "pg";
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual, randomUUID } from "crypto";
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

const USER_SELECT_COLUMNS = `
  id, email, first_name, last_name, preferred_provider,
  subscription_plan, subscription_expires_at,
  ever_paid, credits,
  stripe_customer_id, stripe_subscription_id, stripe_subscription_status,
  stripe_price_id, stripe_current_period_end, stripe_cancel_at_period_end,
  password_hash, created_at
`;

export type AppUserRow = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  preferred_provider?: string | null;
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
  ever_paid?: boolean | null;
  credits?: number | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_subscription_status?: string | null;
  stripe_price_id?: string | null;
  stripe_current_period_end?: string | null;
  stripe_cancel_at_period_end?: boolean | null;
  password_hash: string;
  created_at?: string;
};

export async function getUserByEmail(email: string): Promise<AppUserRow | null> {
  const lower = email.toLowerCase();
  const res = await query<AppUserRow>(
    `select ${USER_SELECT_COLUMNS}
     from users
     where email = $1
     limit 1`,
    [lower]
  );
  return res.rows[0] || null;
}

export async function getUserById(id: string): Promise<AppUserRow | null> {
  const res = await query<AppUserRow>(
    `select ${USER_SELECT_COLUMNS} from users where id = $1 limit 1`,
    [id]
  );
  return res.rows[0] || null;
}

// Category colors (per-user UI preferences)
async function ensureUsersHasCategoryColorsColumn(): Promise<void> {
  await query(`alter table users add column if not exists category_colors jsonb`);
}

export async function getCategoryColorsByEmail(email: string): Promise<Record<string, string> | null> {
  await ensureUsersHasCategoryColorsColumn();
  const lower = email.toLowerCase();
  const res = await query<{ category_colors: any }>(
    `select category_colors from users where email = $1 limit 1`,
    [lower]
  );
  const v = res.rows[0]?.category_colors;
  if (!v) return null;
  try {
    // If stored as JSONB, pg returns object already; just ensure it's a plain object of strings
    if (typeof v === "object" && v != null) return v as Record<string, string>;
    if (typeof v === "string") return JSON.parse(v);
  } catch {}
  return null;
}

export async function updateCategoryColorsByEmail(params: {
  email: string;
  categoryColors: Record<string, string> | null;
}): Promise<void> {
  await ensureUsersHasCategoryColorsColumn();
  const lower = params.email.toLowerCase();
  // Normalize: ensure keys and values are strings; drop empties
  let payload: Record<string, string> | null = null;
  if (params.categoryColors && typeof params.categoryColors === "object") {
    payload = {};
    for (const [k, v] of Object.entries(params.categoryColors)) {
      const key = String(k || "").trim();
      const val = String(v || "").trim();
      if (!key || !val) continue;
      payload[key] = val;
    }
  }
  await query(
    `update users set category_colors = $2 where email = $1`,
    [lower, payload ? JSON.stringify(payload) : null]
  );
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
    `insert into users (email, first_name, last_name, password_hash, subscription_plan, ever_paid, credits)
     values ($1, $2, $3, $4, 'free', false, 3)
     returning id, email, first_name, last_name, preferred_provider, subscription_plan, ever_paid, credits, password_hash, created_at`,
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
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
}): Promise<AppUserRow> {
  const lower = params.email.toLowerCase();
  const existing = await getUserByEmail(lower);
  if (!existing) {
    throw new Error("No local account found for this email");
  }

  // Build dynamic SET clause so that undefined means "do not change"
  const sets: string[] = [];
  const values: any[] = [lower];
  let idx = 2;
  if (Object.prototype.hasOwnProperty.call(params, "firstName")) {
    sets.push(`first_name = $${idx++}`);
    values.push(params.firstName ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(params, "lastName")) {
    sets.push(`last_name = $${idx++}`);
    values.push(params.lastName ?? null);
  }
  // If nothing to update, just return current row
  if (sets.length === 0) {
    return existing as AppUserRow;
  }

  const sql = `update users set ${sets.join(", ")} where email = $1
     returning id, email, first_name, last_name, preferred_provider, subscription_plan, ever_paid, credits, password_hash, created_at`;
  const res = await query<AppUserRow>(sql, values);
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
     returning id, email, first_name, last_name, preferred_provider, subscription_plan, ever_paid, credits, password_hash, created_at`,
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

async function ensureUsersHasStripeBillingColumns(): Promise<void> {
  await query(`
    alter table users add column if not exists stripe_customer_id varchar(255);
    alter table users add column if not exists stripe_subscription_id varchar(255);
    alter table users add column if not exists stripe_subscription_status varchar(64);
    alter table users add column if not exists stripe_price_id varchar(255);
    alter table users add column if not exists stripe_current_period_end timestamptz(6);
    alter table users add column if not exists stripe_cancel_at_period_end boolean;
    alter table users alter column stripe_cancel_at_period_end set default false;
  `);
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
  // When moving to a paid plan, mark ever_paid = true
  if (params.plan === "monthly" || params.plan === "yearly") {
    await query(
      `update users
       set subscription_plan = $2,
           ever_paid = true
       where email = $1`,
      [lower, params.plan]
    );
  } else {
    await query(`update users set subscription_plan = $2 where email = $1`, [lower, params.plan]);
  }
}

function isoStringOrNull(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) return null;
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  return null;
}

function buildUserWhereClause(
  params: { userId?: string | null; email?: string | null },
  startIndex: number
): { clause: string; values: any[] } {
  if (params.userId) {
    return { clause: `id = $${startIndex}`, values: [params.userId] };
  }
  if (params.email) {
    return { clause: `lower(email) = lower($${startIndex})`, values: [params.email] };
  }
  throw new Error("User identifier required");
}

export async function getUserByStripeCustomerId(customerId: string): Promise<AppUserRow | null> {
  if (!customerId) return null;
  await ensureUsersHasStripeBillingColumns();
  const res = await query<AppUserRow>(
    `select ${USER_SELECT_COLUMNS}
     from users
     where stripe_customer_id = $1
     limit 1`,
    [customerId]
  );
  return res.rows[0] || null;
}

export async function getUserByStripeSubscriptionId(subscriptionId: string): Promise<AppUserRow | null> {
  if (!subscriptionId) return null;
  await ensureUsersHasStripeBillingColumns();
  const res = await query<AppUserRow>(
    `select ${USER_SELECT_COLUMNS}
     from users
     where stripe_subscription_id = $1
     limit 1`,
    [subscriptionId]
  );
  return res.rows[0] || null;
}

type StripeStateUpdate = {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStatus?: string | null;
  stripePriceId?: string | null;
  stripeCurrentPeriodEnd?: string | Date | null;
  stripeCancelAtPeriodEnd?: boolean | null;
  subscriptionPlan?: SubscriptionPlan | null;
  subscriptionExpiresAt?: string | Date | null;
};

export async function updateUserStripeState(
  identifier: { userId?: string | null; email?: string | null },
  updates: StripeStateUpdate
): Promise<void> {
  if (!identifier.userId && !identifier.email) {
    throw new Error("updateUserStripeState requires a user identifier");
  }
  await ensureUsersHasStripeBillingColumns();
  await ensureUsersHasSubscriptionPlanColumn();
  await ensureUsersHasSubscriptionExpiresColumn();

  const setParts: string[] = [];
  const values: any[] = [];

  const setField = (column: string, value: any) => {
    setParts.push(`${column} = $${values.length + 1}`);
    values.push(value);
  };

  if (Object.prototype.hasOwnProperty.call(updates, "stripeCustomerId")) {
    setField("stripe_customer_id", updates.stripeCustomerId ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "stripeSubscriptionId")) {
    setField("stripe_subscription_id", updates.stripeSubscriptionId ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "stripeSubscriptionStatus")) {
    setField("stripe_subscription_status", updates.stripeSubscriptionStatus ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "stripePriceId")) {
    setField("stripe_price_id", updates.stripePriceId ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "stripeCurrentPeriodEnd")) {
    setField("stripe_current_period_end", isoStringOrNull(updates.stripeCurrentPeriodEnd));
  }
  if (Object.prototype.hasOwnProperty.call(updates, "stripeCancelAtPeriodEnd")) {
    setField("stripe_cancel_at_period_end", updates.stripeCancelAtPeriodEnd ?? false);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "subscriptionPlan")) {
    setField("subscription_plan", updates.subscriptionPlan ?? null);
    if (updates.subscriptionPlan === "monthly" || updates.subscriptionPlan === "yearly") {
      setParts.push("ever_paid = true");
    }
  }
  if (Object.prototype.hasOwnProperty.call(updates, "subscriptionExpiresAt")) {
    setField("subscription_expires_at", isoStringOrNull(updates.subscriptionExpiresAt));
  }

  if (setParts.length === 0) return;

  const where = buildUserWhereClause(identifier, values.length + 1);
  const sql = `update users set ${setParts.join(", ")} where ${where.clause}`;
  await query(sql, [...values, ...where.values]);
}

// Free credits initialization for legacy users
export async function initFreeCreditsIfMissing(email: string, amount: number = 3): Promise<number | null> {
  await ensureUsersHasSubscriptionPlanColumn();
  await ensureUsersHasCreditsColumn();
  const lower = email.toLowerCase();
  const res = await query<{ credits: number | null }>(
    `update users
     set credits = coalesce(credits, $2)
     where email = $1
       and (subscription_plan = 'free' or subscription_plan is null)
     returning credits`,
    [lower, Math.max(0, Math.trunc(amount))]
  );
  const v = res.rows[0]?.credits;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// Credits helpers
async function ensureUsersHasCreditsColumn(): Promise<void> {
  await query(`alter table users add column if not exists credits integer`);
}

export async function getCreditsByEmail(email: string): Promise<number | null> {
  await ensureUsersHasCreditsColumn();
  const lower = email.toLowerCase();
  const res = await query<{ credits: number | null }>(
    `select credits from users where email = $1 limit 1`,
    [lower]
  );
  const v = res.rows[0]?.credits;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export async function incrementCreditsByEmail(email: string, delta: number): Promise<number> {
  await ensureUsersHasCreditsColumn();
  const lower = email.toLowerCase();
  const res = await query<{ credits: number | null }>(
    `update users
     set credits = case
       when (credits is null or credits <= 0) and $2 < 0 then greatest(0, 3 + $2)
       else greatest(0, coalesce(credits, 0) + $2)
     end
     where email = $1
     returning credits`,
    [lower, Math.trunc(delta)]
  );
  return Number.isFinite(res.rows[0]?.credits as any) ? (res.rows[0]?.credits as number) : 0;
}

// Promo codes
export type PromoCodeRow = {
  id: string;
  code: string;
  amount_cents: number;
  currency: string;
  created_by_email?: string | null;
  created_by_user_id?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  message?: string | null;
  quantity?: number | null;
  period?: string | null; // 'months' | 'years'
  expires_at?: string | null;
  redeemed_at?: string | null;
  redeemed_by_email?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_charge_id?: string | null;
  stripe_refund_id?: string | null;
  revoked_at?: string | null;
  metadata?: any;
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
  createdByUserId?: string | null;
  recipientName?: string | null;
  recipientEmail?: string | null;
  message?: string | null;
  expiresAt?: Date | null;
  quantity?: number | null;
  period?: "months" | "years" | null;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeChargeId?: string | null;
  metadata?: Record<string, any> | null;
}): Promise<PromoCodeRow> {
  const code = generatePromoCode(12);
  // Some databases may enforce NOT NULL on expires_at. Default to 90 days if not provided.
  const defaultTtlMs = 90 * 24 * 60 * 60 * 1000; // 90 days
  const effectiveExpiresAt = (params.expiresAt instanceof Date && !isNaN(params.expiresAt.getTime()))
    ? params.expiresAt
    : new Date(Date.now() + defaultTtlMs);

  const res = await query<PromoCodeRow>(
    `insert into promo_codes (code, amount_cents, currency, created_by_email, recipient_name, recipient_email, message, quantity, period, expires_at, stripe_payment_intent_id, stripe_checkout_session_id, stripe_charge_id, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     returning id, code, amount_cents, currency, created_by_email, recipient_name, recipient_email, message, quantity, period, expires_at, redeemed_at, redeemed_by_email, stripe_payment_intent_id, stripe_checkout_session_id, stripe_charge_id, stripe_refund_id, revoked_at, metadata, created_at`,
    [
      code,
      Math.max(0, Math.floor(params.amountCents || 0)),
      (params.currency || "USD").toUpperCase(),
      params.createdByEmail || null,
      params.recipientName || null,
      params.recipientEmail || null,
      params.message || null,
      params.quantity == null ? null : Math.max(0, Math.floor(params.quantity)),
      params.period || null,
      effectiveExpiresAt.toISOString(),
      params.stripePaymentIntentId || null,
      params.stripeCheckoutSessionId || null,
      params.stripeChargeId || null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ]
  );

  const row = res.rows[0];
  // Attach creator user id when available and column exists. Ignore errors if column is missing.
  if (params.createdByUserId) {
    try {
      await query(
        `update promo_codes set created_by_user_id = $2 where id = $1`,
        [row.id, params.createdByUserId]
      ).catch(() => {});
      row.created_by_user_id = params.createdByUserId;
    } catch (err) {
      console.error("[db] failed to store created_by_user_id on promo code", {
        promoCodeId: row.id,
        createdByUserId: params.createdByUserId,
        error: (err as any)?.message,
      });
    }
  } else if (params.createdByEmail) {
    try {
      const creatorUserId = await getUserIdByEmail(params.createdByEmail);
      if (creatorUserId) {
        await query(
          `update promo_codes set created_by_user_id = $2 where id = $1`,
          [row.id, creatorUserId]
        ).catch(() => {});
        row.created_by_user_id = creatorUserId;
      }
    } catch {
      // best-effort only
    }
  }

  return row;
}

export async function getPromoCodeByCode(code: string): Promise<PromoCodeRow | null> {
  const res = await query<PromoCodeRow>(
    `select id, code, amount_cents, currency, created_by_email, recipient_name, recipient_email, message, quantity, period, expires_at, redeemed_at, redeemed_by_email,
            stripe_payment_intent_id, stripe_checkout_session_id, stripe_charge_id, stripe_refund_id, revoked_at, metadata, created_at
     from promo_codes where code = $1 limit 1`,
    [code]
  );
  return res.rows[0] || null;
}

export async function listRecentPromoCodes(limit: number = 5): Promise<PromoCodeRow[]> {
  const res = await query<PromoCodeRow>(
    `select id, code, amount_cents, currency, created_by_email, recipient_name, recipient_email, message, quantity, period, expires_at, redeemed_at, redeemed_by_email,
            stripe_payment_intent_id, stripe_checkout_session_id, stripe_charge_id, stripe_refund_id, revoked_at, metadata, created_at
     from promo_codes
     order by created_at desc
     limit $1`,
    [Math.max(1, Math.min(50, Math.floor(limit)))]
  );
  return res.rows || [];
}

export async function getCurrentDatabaseIdentity(): Promise<{ db: string; user: string; host: string | null } | null> {
  try {
    const r = await query<{ db: string; user: string; host: string | null }>(
      `select current_database() as db, current_user as user, inet_server_addr()::text as host`
    );
    return r.rows[0] || null;
  } catch {
    return null;
  }
}

export async function markPromoCodeRedeemed(id: string, redeemedByEmail?: string | null): Promise<void> {
  await query(
    `update promo_codes
     set redeemed_at = now(),
         redeemed_by_email = coalesce($2, redeemed_by_email),
         expires_at = coalesce(expires_at, now() + interval '90 days')
     where id = $1 and redeemed_at is null`,
    [id, redeemedByEmail || null]
  );
}

export async function revokePromoCodesByPaymentIntent(params: {
  paymentIntentId: string;
  refundId?: string | null;
  metadata?: Record<string, any> | null;
}): Promise<void> {
  const metaJson = params.metadata ? JSON.stringify(params.metadata) : null;
  await query(
    `update promo_codes
     set revoked_at = now(),
         stripe_refund_id = coalesce($2, stripe_refund_id),
         metadata = case when $3::text is not null then coalesce(metadata, '{}'::jsonb) || $3::jsonb else metadata end
     where stripe_payment_intent_id = $1 and revoked_at is null`,
    [params.paymentIntentId, params.refundId || null, metaJson]
  );
}

export type GiftOrderRow = {
  id: string;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_customer_id?: string | null;
  purchaser_email?: string | null;
  purchaser_name?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  message?: string | null;
  quantity: number;
  period: string;
  amount_cents: number;
  currency: string;
  status: string;
  promo_code_id?: string | null;
  metadata?: any;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function createGiftOrder(params: {
  purchaserEmail?: string | null;
  purchaserName?: string | null;
  recipientName?: string | null;
  recipientEmail?: string | null;
  message?: string | null;
  quantity: number;
  period: "months" | "years";
  amountCents: number;
  currency?: string;
  metadata?: Record<string, any> | null;
}): Promise<GiftOrderRow> {
  const res = await query<GiftOrderRow>(
    `insert into gift_orders (purchaser_email, purchaser_name, recipient_name, recipient_email, message, quantity, period, amount_cents, currency, status, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)
     returning id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_customer_id, purchaser_email, purchaser_name,
               recipient_name, recipient_email, message, quantity, period, amount_cents, currency, status, promo_code_id,
               metadata, created_at, updated_at`,
    [
      params.purchaserEmail || null,
      params.purchaserName || null,
      params.recipientName || null,
      params.recipientEmail || null,
      params.message || null,
      Math.max(1, Math.floor(params.quantity || 1)),
      params.period,
      Math.max(0, Math.floor(params.amountCents || 0)),
      (params.currency || "USD").toUpperCase(),
      params.metadata ? JSON.stringify(params.metadata) : null,
    ]
  );
  return res.rows[0];
}

export async function updateGiftOrderStripeRefs(params: {
  orderId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
}): Promise<void> {
  const setParts: string[] = [];
  const values: any[] = [];

  const push = (column: string, value: any) => {
    setParts.push(`${column} = $${values.length + 1}`);
    values.push(value);
  };

  if (params.stripeCheckoutSessionId !== undefined) {
    push("stripe_checkout_session_id", params.stripeCheckoutSessionId);
  }
  if (params.stripePaymentIntentId !== undefined) {
    push("stripe_payment_intent_id", params.stripePaymentIntentId);
  }
  if (params.stripeCustomerId !== undefined) {
    push("stripe_customer_id", params.stripeCustomerId);
  }
  if (params.status) {
    push("status", params.status);
  }
  if (params.metadata) {
    setParts.push(`metadata = coalesce(metadata, '{}'::jsonb) || $${values.length + 1}::jsonb`);
    values.push(JSON.stringify(params.metadata));
  }
  if (!setParts.length) return;

  setParts.push("updated_at = now()");
  values.push(params.orderId);
  await query(
    `update gift_orders set ${setParts.join(", ")} where id = $${values.length}`,
    values
  );
}

export async function markGiftOrderStatus(params: {
  orderId: string;
  status: "pending" | "paid" | "fulfilled" | "failed" | "refunded";
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  stripeRefundId?: string | null;
  metadataMerge?: Record<string, any> | null;
}): Promise<void> {
  const setParts: string[] = ["status = $1", "updated_at = now()"]; // $1 reserved for status
  const values: any[] = [params.status];

  if (params.stripePaymentIntentId !== undefined) {
    setParts.push(`stripe_payment_intent_id = $${values.length + 1}`);
    values.push(params.stripePaymentIntentId);
  }

  const metadata: Record<string, any> = {};
  if (params.stripeChargeId !== undefined && params.stripeChargeId !== null) {
    metadata.chargeId = params.stripeChargeId;
  }
  if (params.stripeRefundId !== undefined && params.stripeRefundId !== null) {
    metadata.refundId = params.stripeRefundId;
  }
  if (params.metadataMerge) {
    Object.assign(metadata, params.metadataMerge);
  }
  if (Object.keys(metadata).length > 0) {
    setParts.push(`metadata = coalesce(metadata, '{}'::jsonb) || $${values.length + 1}::jsonb`);
    values.push(JSON.stringify(metadata));
  }

  values.push(params.orderId);
  const sql = `update gift_orders set ${setParts.join(", ")} where id = $${values.length}`;
  await query(sql, values);
}

export async function attachPromoCodeToGiftOrder(params: {
  orderId: string;
  promoCodeId: string;
  status?: "fulfilled" | "paid";
}): Promise<void> {
  const setParts = ["promo_code_id = $1", "updated_at = now()"]; // $1 reserved
  const values: any[] = [params.promoCodeId];
  if (params.status) {
    setParts.push(`status = $${values.length + 1}`);
    values.push(params.status);
  }
  values.push(params.orderId);
  await query(`update gift_orders set ${setParts.join(", ")} where id = $${values.length}`, values);
}

export async function getGiftOrderById(id: string): Promise<GiftOrderRow | null> {
  const res = await query<GiftOrderRow>(
    `select id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_customer_id, purchaser_email, purchaser_name,
            recipient_name, recipient_email, message, quantity, period, amount_cents, currency, status, promo_code_id,
            metadata, created_at, updated_at
     from gift_orders
     where id = $1
     limit 1`,
    [id]
  );
  return res.rows[0] || null;
}

export async function getGiftOrderByCheckoutSessionId(sessionId: string): Promise<GiftOrderRow | null> {
  if (!sessionId) return null;
  const res = await query<GiftOrderRow>(
    `select id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_customer_id, purchaser_email, purchaser_name,
            recipient_name, recipient_email, message, quantity, period, amount_cents, currency, status, promo_code_id,
            metadata, created_at, updated_at
     from gift_orders
     where stripe_checkout_session_id = $1
     limit 1`,
    [sessionId]
  );
  return res.rows[0] || null;
}

export async function getGiftOrderByPaymentIntentId(paymentIntentId: string): Promise<GiftOrderRow | null> {
  if (!paymentIntentId) return null;
  const res = await query<GiftOrderRow>(
    `select id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_customer_id, purchaser_email, purchaser_name,
            recipient_name, recipient_email, message, quantity, period, amount_cents, currency, status, promo_code_id,
            metadata, created_at, updated_at
     from gift_orders
     where stripe_payment_intent_id = $1
     limit 1`,
    [paymentIntentId]
  );
  return res.rows[0] || null;
}

export async function recordStripeWebhookEvent(params: {
  eventId: string;
  type: string;
  payload: any;
}): Promise<boolean> {
  if (!params.eventId) return false;
  const res = await query<{ id: string }>(
    `insert into stripe_webhook_events (event_id, type, payload)
     values ($1, $2, $3)
     on conflict (event_id) do nothing
     returning id`,
    [params.eventId, params.type, JSON.stringify(params.payload ?? {})]
  );
  return (res.rowCount ?? 0) > 0;
}

// Subscription expiration helpers
async function ensureUsersHasSubscriptionExpiresColumn(): Promise<void> {
  await query(`alter table users add column if not exists subscription_expires_at timestamptz(6)`);
}

export async function extendUserSubscriptionByMonths(email: string, months: number): Promise<{ expiresAt: string | null }> {
  await ensureUsersHasSubscriptionPlanColumn();
  await ensureUsersHasSubscriptionExpiresColumn();
  const lower = email.toLowerCase();
  const monthsInt = Math.max(0, Math.floor(months));
  if (monthsInt <= 0) return { expiresAt: null };
  // Compute new expiry in SQL: if null or past, base is now(); else existing date
  const res = await query<{ subscription_expires_at: string | null }>(
    `update users
     set subscription_plan = case when subscription_plan in ('monthly','yearly') then subscription_plan else 'monthly' end,
         ever_paid = true,
         subscription_expires_at = (
           case
             when subscription_expires_at is null or subscription_expires_at < now() then (now() + make_interval(months => $2))
             else (subscription_expires_at + make_interval(months => $2))
           end
         )
     where email = $1
     returning subscription_expires_at`,
    [lower, monthsInt]
  );
  return { expiresAt: res.rows[0]?.subscription_expires_at || null };
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
  const id = randomUUID();
  const res = await query<EventHistoryRow>(
    `insert into event_history (id, user_id, title, data, created_at)
     values ($1, $2, $3, $4, coalesce(now(), now()))
     returning id, user_id, title, data, created_at`,
    [id, params.userId || null, params.title, JSON.stringify(params.data)]
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

export async function updateEventHistoryDataMerge(
  id: string,
  patch: any
): Promise<EventHistoryRow | null> {
  // Merge provided patch object into existing JSONB data. Later keys override.
  // jsonb concatenation '||' merges objects shallowly; sufficient for category updates.
  const res = await query<EventHistoryRow>(
    `update event_history
     set data = coalesce(data, '{}'::jsonb) || $2::jsonb
     where id = $1
     returning id, user_id, title, data, created_at`,
    [id, JSON.stringify(patch ?? {})]
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
     order by created_at desc nulls last, id desc
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
     order by created_at desc nulls last, id desc
     limit $2`,
    [userId, Math.max(1, Math.min(200, limit))]
  );
  return res.rows;
}

export async function listRecentEventHistory(limit: number = 20): Promise<EventHistoryRow[]> {
  const res = await query<EventHistoryRow>(
    `select id, user_id, title, data, created_at
     from event_history
     order by created_at desc nulls last, id desc
     limit $1`,
    [Math.max(1, Math.min(200, limit))]
  );
  return res.rows || [];
}

// Shared events
export type EventShareRow = {
  id: string;
  event_id: string;
  owner_user_id: string;
  recipient_user_id: string;
  status: "pending" | "accepted" | "revoked";
  invite_code?: string | null;
  recipient_first_name?: string | null;
  recipient_last_name?: string | null;
  created_at?: string;
  accepted_at?: string | null;
  revoked_at?: string | null;
};

async function ensureEventSharesHasRecipientNameColumns(): Promise<void> {
  // Best-effort: add optional display name fields for recipients so owners can see names
  await query(`alter table event_shares add column if not exists recipient_first_name text`);
  await query(`alter table event_shares add column if not exists recipient_last_name text`);
}

export async function createOrUpdateEventShare(params: {
  eventId: string;
  ownerUserId: string;
  recipientEmail: string;
  recipientFirstName?: string | null;
  recipientLastName?: string | null;
}): Promise<EventShareRow> {
  await ensureEventSharesHasRecipientNameColumns();
  const recipientId = await getUserIdByEmail(params.recipientEmail);
  if (!recipientId) throw new Error("Recipient user not found");
  if (recipientId === params.ownerUserId) throw new Error("Cannot share to yourself");
  const invite = randomUUID();
  const res = await query<EventShareRow>(
    `insert into event_shares (event_id, owner_user_id, recipient_user_id, status, invite_code, recipient_first_name, recipient_last_name)
     values ($1, $2, $3, 'pending', $4, $5, $6)
     on conflict (event_id, recipient_user_id) where revoked_at is null
     do update set status = excluded.status,
                   invite_code = excluded.invite_code,
                   recipient_first_name = excluded.recipient_first_name,
                   recipient_last_name = excluded.recipient_last_name,
                   created_at = now(),
                   accepted_at = null
     returning id, event_id, owner_user_id, recipient_user_id, status, invite_code, recipient_first_name, recipient_last_name, created_at, accepted_at, revoked_at`,
    [params.eventId, params.ownerUserId, recipientId, invite, (params.recipientFirstName || null), (params.recipientLastName || null)]
  );
  return res.rows[0];
}

export async function acceptEventShare(params: {
  eventId: string;
  recipientUserId: string;
}): Promise<EventShareRow | null> {
  const res = await query<EventShareRow>(
    `update event_shares
     set status = 'accepted', accepted_at = now()
     where event_id = $1 and recipient_user_id = $2 and status = 'pending' and revoked_at is null
     returning id, event_id, owner_user_id, recipient_user_id, status, invite_code, created_at, accepted_at, revoked_at`,
    [params.eventId, params.recipientUserId]
  );
  return res.rows[0] || null;
}

export async function revokeEventShare(params: {
  eventId: string;
  byUserId: string;
  recipientUserId?: string | null;
}): Promise<number> {
  // Allow owner to revoke specific recipient or all; allow recipient to revoke their own
  if (params.recipientUserId) {
    const res = await query<{ count: string }>(
      `with target as (
         select * from event_shares
         where event_id = $1
           and revoked_at is null
           and (owner_user_id = $2 or recipient_user_id = $2)
           and recipient_user_id = $3
       )
       update event_shares es
       set status = 'revoked', revoked_at = now()
       from target t
       where es.id = t.id
       returning es.id`,
      [params.eventId, params.byUserId, params.recipientUserId]
    );
    return res.rowCount || 0;
  }
  // If recipientUserId not provided, attempt recipient self-revoke first
  const asRecipient = await query<{ id: string }>(
    `update event_shares
     set status = 'revoked', revoked_at = now()
     where event_id = $1 and recipient_user_id = $2 and revoked_at is null`,
    [params.eventId, params.byUserId]
  );
  if ((asRecipient.rowCount || 0) > 0) return asRecipient.rowCount || 0;
  // Otherwise, allow owner to revoke all
  const asOwner = await query<{ id: string }>(
    `update event_shares
     set status = 'revoked', revoked_at = now()
     where event_id = $1 and owner_user_id = $2 and revoked_at is null`,
    [params.eventId, params.byUserId]
  );
  return asOwner.rowCount || 0;
}

export async function listAcceptedSharedEventsForUser(userId: string): Promise<EventHistoryRow[]> {
  const res = await query<EventHistoryRow>(
    `select eh.id, eh.user_id, eh.title, eh.data, eh.created_at
     from event_shares es
     join event_history eh on eh.id = es.event_id
     where es.recipient_user_id = $1
       and es.status = 'accepted'
       and es.revoked_at is null
     order by eh.created_at desc nulls last, eh.id desc` ,
    [userId]
  );
  return res.rows || [];
}

export async function listSharesByOwnerForEvents(ownerUserId: string, eventIds: string[]): Promise<{
  event_id: string;
  accepted_count: number;
  pending_count: number;
}[]> {
  if (eventIds.length === 0) return [];
  const res = await query<{ event_id: string; accepted_count: string; pending_count: string }>(
    `select event_id,
            count(*) filter (where status = 'accepted' and revoked_at is null) as accepted_count,
            count(*) filter (where status = 'pending' and revoked_at is null)  as pending_count
     from event_shares
     where owner_user_id = $1 and event_id = any($2::uuid[])
     group by event_id`,
    [ownerUserId, eventIds]
  );
  return (res.rows || []).map((r) => ({
    event_id: r.event_id,
    accepted_count: Number(r.accepted_count || 0),
    pending_count: Number(r.pending_count || 0),
  }));
}

export async function isEventSharedWithUser(eventId: string, userId: string): Promise<boolean | null> {
  try {
    const res = await query<{ exists: boolean }>(
      `select exists(
         select 1 from event_shares
         where event_id = $1 and recipient_user_id = $2 and status = 'accepted' and revoked_at is null
       ) as exists`,
      [eventId, userId]
    );
    return Boolean(res.rows[0]?.exists);
  } catch {
    // If the shares table does not exist, return null so callers can decide a fallback behavior (e.g., dev email-only shares)
    return null;
  }
}

export async function isEventSharePendingForUser(eventId: string, userId: string): Promise<boolean | null> {
  try {
    const res = await query<{ exists: boolean }>(
      `select exists(
         select 1 from event_shares
         where event_id = $1 and recipient_user_id = $2 and status = 'pending' and revoked_at is null
       ) as exists`,
      [eventId, userId]
    );
    return Boolean(res.rows[0]?.exists);
  } catch {
    return null;
  }
}

export async function listShareRecipientsForEvent(ownerUserId: string, eventId: string): Promise<Array<{ id: string; name: string; email: string; status: "pending"|"accepted" }>> {
  await ensureEventSharesHasRecipientNameColumns();
  const res = await query<{ id: string; recipient_user_id: string; status: string; recipient_first_name: string | null; recipient_last_name: string | null }>(
    `select id, recipient_user_id, status, recipient_first_name, recipient_last_name
     from event_shares
     where owner_user_id = $1 and event_id = $2 and revoked_at is null
     order by created_at asc`,
    [ownerUserId, eventId]
  );
  const rows = res.rows || [];
  const out: Array<{ id: string; name: string; email: string; status: "pending"|"accepted" }> = [];
  for (const r of rows) {
    try {
      // Prefer the name captured at share-time; otherwise fall back to the recipient user's profile; finally fall back to email/local-part
      const user = await getUserById(r.recipient_user_id);
      const shareName = [r.recipient_first_name, r.recipient_last_name].filter(Boolean).join(" ");
      const profileName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
      const emailLocal = (user?.email || "").split("@")[0] || "Unknown";
      const displayName = (shareName || profileName || emailLocal || "Unknown").trim();
      out.push({
        id: r.id,
        name: displayName,
        email: user?.email || "",
        status: r.status === "accepted" ? "accepted" : "pending",
      });
    } catch {
      out.push({ id: r.id, name: "Unknown", email: "", status: r.status === "accepted" ? "accepted" : "pending" });
    }
  }
  return out;
}

export async function revokeShareByOwner(eventShareId: string, ownerUserId: string): Promise<boolean> {
  const res = await query<{ id: string }>(
    `update event_shares set revoked_at = now()
     where id = $1 and owner_user_id = $2 and revoked_at is null
     returning id`,
    [eventShareId, ownerUserId]
  );
  return Boolean(res.rows?.[0]?.id);
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
  const id = randomUUID();
  const res = await query<PasswordResetRow>(
    `insert into password_resets (id, email, token, expires_at)
     values ($1, $2, $3, $4)
     returning id, email, token, expires_at, used_at, created_at`,
    [id, lower, token, expires.toISOString()]
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
