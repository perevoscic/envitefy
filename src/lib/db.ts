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
    if (ssl) poolConfig.ssl = ssl;
    global.__pgPool = new Pool(poolConfig);
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

async function getUserIdByEmail(email: string): Promise<string | null> {
  const lower = email.toLowerCase();
  const res = await query<{ id: string }>(`select id from users where email = $1 limit 1`, [lower]);
  return res.rows[0]?.id || null;
}

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
