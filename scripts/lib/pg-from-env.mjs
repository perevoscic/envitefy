/**
 * Shared DATABASE_URL pool setup (matches scripts/init-db.js env + SSL behavior).
 */

import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

export function loadEnvFromDotenvIfMissing() {
  const dotenvPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(dotenvPath)) return;
  const text = fs.readFileSync(dotenvPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

export function buildSslConfigFromEnv() {
  let ssl;
  const disableVerify = String(process.env.PGSSL_DISABLE_VERIFY || "").toLowerCase();
  const caBase64 = process.env.PGSSL_CA_BASE64;
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
  return ssl;
}

export function createPoolFromEnv() {
  loadEnvFromDotenvIfMissing();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Set it in the environment or .env file.");
  }
  const ssl = buildSslConfigFromEnv();
  let connectionStringToUse = databaseUrl;
  if (ssl) {
    try {
      const u = new URL(databaseUrl);
      u.searchParams.delete("sslmode");
      u.searchParams.delete("ssl");
      connectionStringToUse = u.toString();
    } catch {
      // keep URL as-is
    }
  }
  const poolConfig = { connectionString: connectionStringToUse, max: 2 };
  if (ssl) poolConfig.ssl = ssl;
  return new Pool(poolConfig);
}
