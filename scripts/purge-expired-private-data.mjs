import { createPoolFromEnv } from "./lib/pg-from-env.mjs";

const apply = process.argv.includes("--apply");
const pool = createPoolFromEnv();

try {
  const relations = [
    { table: "scan_attempts", label: "scan diagnostic record" },
    { table: "private_data_access_logs", label: "private-data access log" },
  ];
  for (const relation of relations) {
    const existsResult = await pool.query(
      "select to_regclass($1) is not null as exists",
      [`public.${relation.table}`],
    );
    if (!existsResult.rows[0]?.exists) {
      console.log(`${relation.table} does not exist; nothing to purge.`);
      continue;
    }
    if (!apply) {
      const result = await pool.query(
        `select count(*)::integer as count from ${relation.table} where expires_at <= now()`,
      );
      console.log(
        `${result.rows[0]?.count || 0} expired ${relation.label}(s) would be deleted. Run with --apply to delete them.`,
      );
      continue;
    }
    const result = await pool.query(
      `delete from ${relation.table} where expires_at <= now() returning id`,
    );
    console.log(`Deleted ${result.rowCount || 0} expired ${relation.label}(s).`);
  }
} finally {
  await pool.end();
}
