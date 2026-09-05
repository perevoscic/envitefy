import { readFile } from "node:fs/promises";
import { connectScanDatabase } from "./scan-diagnostics-db.mjs";

const client = await connectScanDatabase();
try {
  const sql = await readFile(new URL("../prisma/manual_sql/20260905_scan_diagnostics_queue.sql", import.meta.url), "utf8");
  await client.query(sql);
  console.log("Scan diagnostics migration applied; request-time schema setup is no longer needed.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
