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
    // SSL handling: prefer strict verification; allow opt-out or custom CA via env
    let ssl: boolean | { rejectUnauthorized: boolean; ca?: string } = true;
    const disableVerify = (process.env.PGSSL_DISABLE_VERIFY || "").toLowerCase();
    const caBase64 = process.env.PGSSL_CA_BASE64 as string | undefined;
    if (disableVerify === "1" || disableVerify === "true") {
      ssl = { rejectUnauthorized: false };
    } else if (caBase64 && caBase64.trim().length > 0) {
      try {
        const ca = Buffer.from(caBase64, "base64").toString("utf8");
        ssl = { rejectUnauthorized: true, ca };
      } catch {
        ssl = true;
      }
    }
    global.__pgPool = new Pool({ connectionString: databaseUrl, max: 10, ssl });
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
  password_hash: string;
  created_at?: string;
};

export async function getUserByEmail(email: string): Promise<AppUserRow | null> {
  const lower = email.toLowerCase();
  const res = await query<AppUserRow>(
    `select id, email, first_name, last_name, password_hash, created_at
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
     returning id, email, first_name, last_name, password_hash, created_at`,
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


