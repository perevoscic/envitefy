/*
  Initializes the database by enabling pgcrypto and creating required tables.
  - Reads DATABASE_URL, PGSSL_CA_BASE64, PGSSL_DISABLE_VERIFY from process.env or .env
  - Applies SQL from prisma/manual_sql/init_db_pgcrypto.sql
*/

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

function loadEnvFromDotenvIfMissing() {
  const dotenvPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(dotenvPath)) return;
  const text = fs.readFileSync(dotenvPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

function buildSslConfigFromEnv() {
  // Build SSL only when explicitly requested via env
  let ssl = undefined;
  const disableVerify = String(process.env.PGSSL_DISABLE_VERIFY || "").toLowerCase();
  const caBase64 = process.env.PGSSL_CA_BASE64;
  if (disableVerify === "1" || disableVerify === "true") {
    ssl = { rejectUnauthorized: false };
  } else if (caBase64 && caBase64.trim().length > 0) {
    try {
      const ca = Buffer.from(caBase64, "base64").toString("utf8");
      ssl = { rejectUnauthorized: true, ca };
    } catch (err) {
      // leave ssl undefined to allow DATABASE_URL to decide
      ssl = undefined;
    }
  }
  return ssl;
}

async function main() {
  loadEnvFromDotenvIfMissing();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Set it in the environment or .env file.");
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), "prisma/manual_sql/init_db_pgcrypto.sql");
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found at ${sqlPath}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, "utf8");

  const ssl = buildSslConfigFromEnv();
  // If passing explicit ssl, strip ssl-related params from URL to avoid conflicts
  let connectionStringToUse = databaseUrl;
  if (ssl) {
    try {
      const u = new URL(databaseUrl);
      u.searchParams.delete("sslmode");
      u.searchParams.delete("ssl");
      connectionStringToUse = u.toString();
    } catch {}
  }
  const poolConfig = { connectionString: connectionStringToUse, max: 1 };
  if (ssl) poolConfig.ssl = ssl;
  const pool = new Pool(poolConfig);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Database initialized successfully (pgcrypto + tables).");
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Failed to initialize database:", err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});


