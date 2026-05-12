import { query } from "@/lib/db";
import { daysAgo, tableExists, toIsoString, toNumber } from "./data-utils";

export type AdminConciergeSession = {
  id: string;
  status: string;
  ownerEmail: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

export type AdminConciergeData = {
  available: boolean;
  summary: {
    sessions: number;
    active7Days: number;
    published: number;
    drafts: number;
    threads: number;
    messages: number;
  };
  statuses: Array<{ status: string; count: number }>;
  recentSessions: AdminConciergeSession[];
};

export type AdminConciergeDataOptions = {
  includeRecent?: boolean;
};

export async function getAdminConciergeData(
  options: AdminConciergeDataOptions = {},
): Promise<AdminConciergeData> {
  const includeRecent = options.includeRecent ?? true;
  const [sessionsExist, threadsExist, messagesExist] = await Promise.all([
    tableExists("creation_sessions"),
    tableExists("conversation_threads"),
    tableExists("conversation_messages"),
  ]);

  if (!sessionsExist) {
    return {
      available: false,
      summary: {
        sessions: 0,
        active7Days: 0,
        published: 0,
        drafts: 0,
        threads: 0,
        messages: 0,
      },
      statuses: [],
      recentSessions: [],
    };
  }

  const [summary, statuses, recent, threads, messages] = await Promise.all([
    query<{
      sessions: string;
      active_7_days: string;
      published: string;
      drafts: string;
    }>(
      `select
         count(*)::text as sessions,
         count(*) filter (where updated_at >= $1::timestamptz)::text as active_7_days,
         count(*) filter (where status in ('published', 'publishing'))::text as published,
         count(*) filter (where status not in ('published', 'publishing'))::text as drafts
       from creation_sessions`,
      [daysAgo(7)],
    ),
    query<{ status: string | null; count: string }>(
      `select coalesce(nullif(status, ''), 'unknown') as status, count(*)::text as count
       from creation_sessions
       group by 1
       order by count(*) desc, 1 asc
       limit 8`,
    ),
    includeRecent
      ? query<{
          id: string;
          status: string | null;
          owner_email: string | null;
          created_at: Date | string | null;
          updated_at: Date | string | null;
        }>(
          `select cs.id,
                  cs.status,
                  users.email as owner_email,
                  cs.created_at,
                  cs.updated_at
           from creation_sessions cs
           left join users on users.id = cs.user_id
           order by cs.updated_at desc nulls last, cs.created_at desc nulls last
           limit 8`,
        )
      : Promise.resolve({
          rows: [] as Array<{
            id: string;
            status: string | null;
            owner_email: string | null;
            created_at: Date | string | null;
            updated_at: Date | string | null;
          }>,
        }),
    threadsExist
      ? query<{ n: string }>(`select count(*)::text as n from conversation_threads`)
      : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<ReturnType<typeof query<{ n: string }>>>),
    messagesExist
      ? query<{ n: string }>(`select count(*)::text as n from conversation_messages`)
      : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<ReturnType<typeof query<{ n: string }>>>),
  ]);

  const summaryRow = summary.rows[0];

  return {
    available: true,
    summary: {
      sessions: toNumber(summaryRow?.sessions),
      active7Days: toNumber(summaryRow?.active_7_days),
      published: toNumber(summaryRow?.published),
      drafts: toNumber(summaryRow?.drafts),
      threads: toNumber(threads.rows[0]?.n),
      messages: toNumber(messages.rows[0]?.n),
    },
    statuses: statuses.rows.map((row) => ({
      status: row.status || "unknown",
      count: toNumber(row.count),
    })),
    recentSessions: recent.rows.map((row) => ({
      id: row.id,
      status: row.status || "unknown",
      ownerEmail: row.owner_email || null,
      createdAt: toIsoString(row.created_at),
      updatedAt: toIsoString(row.updated_at),
    })),
  };
}
