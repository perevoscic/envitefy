import { createHash } from "node:crypto";
import { query } from "@/lib/db";

let schemaPromise: Promise<void> | null = null;

async function ensurePrivateDataAccessLogSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
        create table if not exists private_data_access_logs (
          id uuid primary key default gen_random_uuid(),
          actor_email text not null,
          action text not null,
          resource_type text not null,
          resource_id text not null,
          purpose text not null,
          ip_hash text,
          user_agent text,
          occurred_at timestamptz(6) not null default now(),
          expires_at timestamptz(6) not null default (now() + interval '1 year')
        )
      `);
      await query(`
        create index if not exists idx_private_data_access_logs_resource
        on private_data_access_logs(resource_type, resource_id, occurred_at desc)
      `);
      await query(`
        create index if not exists idx_private_data_access_logs_expires_at
        on private_data_access_logs(expires_at)
      `);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

function hashRequestIp(headers: Headers): string | null {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "";
  if (!ip) return null;
  const salt =
    process.env.PRIVATE_ACCESS_LOG_SALT ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "development";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}

export async function recordPrivateDataAccess(params: {
  actorEmail: string;
  action: "view_scan_detail" | "view_scan_preview";
  resourceId: string;
  headers: Headers;
}): Promise<void> {
  await ensurePrivateDataAccessLogSchema();
  await query(
    `insert into private_data_access_logs (
       actor_email, action, resource_type, resource_id, purpose, ip_hash, user_agent
     ) values ($1, $2, 'scan_attempt', $3, 'admin_troubleshooting', $4, $5)`,
    [
      params.actorEmail.trim().toLowerCase(),
      params.action,
      params.resourceId,
      hashRequestIp(params.headers),
      params.headers.get("user-agent")?.trim().slice(0, 500) || null,
    ],
  );
}
