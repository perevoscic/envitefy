import { query } from "@/lib/db";

export type SavedGa4Connection = {
  email: string;
  refreshToken: string;
};

// Analytics is an admin-wide integration, separate from personal calendar tokens.
export async function getSavedGa4Connection(): Promise<SavedGa4Connection | null> {
  const result = await query<{ email: string; refresh_token: string }>(
    `select email, refresh_token from oauth_tokens
     where provider = 'google-analytics'
     order by updated_at desc, id desc limit 1`,
  );
  const row = result.rows[0];
  return row ? { email: row.email, refreshToken: row.refresh_token } : null;
}

export async function saveGa4Connection(
  connection: SavedGa4Connection,
  adminUserId: string,
): Promise<void> {
  await query(
    `insert into oauth_tokens (email, provider, refresh_token, user_id, updated_at, created_at)
     values ($1, 'google-analytics', $2, $3, now(), now())
     on conflict (email, provider)
     do update set refresh_token = excluded.refresh_token,
                   user_id = excluded.user_id,
                   updated_at = now()`,
    [connection.email.trim().toLowerCase(), connection.refreshToken, adminUserId],
  );
}
