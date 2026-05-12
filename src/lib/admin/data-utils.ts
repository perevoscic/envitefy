import { query } from "@/lib/db";

export type CountRow = { n: string | number | null };

export function toNumber(value: string | number | null | undefined): number {
  const next = Number(value ?? 0);
  return Number.isFinite(next) ? next : 0;
}

export function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

export async function tableExists(tableName: string): Promise<boolean> {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
  if (!safeName) return false;
  const result = await query<{ exists: string | null }>(`select to_regclass($1)::text as exists`, [
    `public.${safeName}`,
  ]);
  return Boolean(result.rows[0]?.exists);
}

export function normalizeCategory(value: string | null | undefined): string {
  const raw = String(value || "").trim();
  return raw || "Uncategorized";
}

export function humanizeCategory(value: string | null | undefined): string {
  const raw = normalizeCategory(value)
    .replace(/^sport_/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return raw.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const ADMIN_SCAN_SQL = `
  (
    lower(coalesce(data->>'createdVia', '')) = 'ocr'
    or lower(coalesce(data->>'createdVia', '')) like 'ocr-%'
    or lower(coalesce(data->'sourceContext'->>'type', '')) in ('upload', 'snap', 'ocr_text')
  )
`;
