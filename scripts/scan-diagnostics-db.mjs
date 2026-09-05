import nextEnv from "@next/env";
import pg from "pg";

export async function connectScanDatabase() {
  nextEnv.loadEnvConfig(process.cwd(), true);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const url = new URL(process.env.DATABASE_URL);
  let ssl;
  if (/^(1|true)$/i.test(process.env.PGSSL_DISABLE_VERIFY || "")) {
    ssl = { rejectUnauthorized: false };
  } else if (process.env.PGSSL_CA_BASE64?.trim()) {
    ssl = { rejectUnauthorized: true, ca: Buffer.from(process.env.PGSSL_CA_BASE64, "base64").toString("utf8") };
  }
  if (ssl) {
    url.searchParams.delete("sslmode");
    url.searchParams.delete("ssl");
  }
  const client = new pg.Client({ connectionString: url.toString(), ssl, connectionTimeoutMillis: 5000 });
  await client.connect();
  return client;
}
