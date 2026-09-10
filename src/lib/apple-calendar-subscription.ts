import { randomBytes } from "node:crypto";
import { query } from "@/lib/db";

type SubscriptionRow = {
  user_id: string;
  token: string;
  last_fetched_at: Date | string | null;
};

let schemaReady: Promise<void> | null = null;
async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(`CREATE TABLE IF NOT EXISTS apple_calendar_subscriptions (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      token text UNIQUE NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_fetched_at timestamptz
    )`).then(() => {}).catch((error: Error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

function missingTable(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "42P01");
}

export async function getAppleCalendarSubscription(userId: string): Promise<SubscriptionRow | null> {
  try {
    const result = await query<SubscriptionRow>(
      "SELECT user_id, token, last_fetched_at FROM apple_calendar_subscriptions WHERE user_id = $1",
      [userId],
    );
    return result.rows[0] || null;
  } catch (error) {
    if (missingTable(error)) return null;
    throw error;
  }
}

export async function prepareAppleCalendarSubscription(userId: string): Promise<SubscriptionRow> {
  await ensureSchema();
  const result = await query<SubscriptionRow>(
    `INSERT INTO apple_calendar_subscriptions (user_id, token) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET user_id = excluded.user_id
     RETURNING user_id, token, last_fetched_at`,
    [userId, randomBytes(32).toString("hex")],
  );
  return result.rows[0];
}

export async function disconnectAppleCalendarSubscription(userId: string): Promise<void> {
  try {
    await query("DELETE FROM apple_calendar_subscriptions WHERE user_id = $1", [userId]);
  } catch (error) {
    if (!missingTable(error)) throw error;
  }
}

export async function resolveAppleCalendarSubscriber(token: string): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    const result = await query<{ user_id: string }>(
      "SELECT user_id FROM apple_calendar_subscriptions WHERE token = $1",
      [token],
    );
    return result.rows[0]?.user_id || null;
  } catch (error) {
    if (missingTable(error)) return null;
    throw error;
  }
}

export async function markAppleCalendarFetched(userId: string, token: string): Promise<void> {
  await query(
    "UPDATE apple_calendar_subscriptions SET last_fetched_at = now() WHERE user_id = $1 AND token = $2",
    [userId, token],
  );
}
