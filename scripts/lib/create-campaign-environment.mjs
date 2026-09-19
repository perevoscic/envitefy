import { randomBytes, randomUUID, scryptSync, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer, request as httpRequest } from "node:http";
import { connect as netConnect } from "node:net";
import { createReadStream } from "node:fs";
import { access, mkdir, readFile, writeFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";

const MARKER = ".campaign-runtime.json";
const DATABASE = "envitefy_create_campaign";
const ROLE = "envitefy_campaign";
const MIME = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".pdf": "application/pdf", ".json": "application/json" };
const PERSONAS = ["mom", "teacher", "coach", "gymnast", "general"];
const TEMPLATE_KEYS = ["birthdays", "weddings", "anniversaries", "baby_showers", "gender_reveal", "sport_events", "gymnastics", "football_season"];

export function requireLoopbackUrl(value, label = "URL") {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.username || url.password) {
    throw new Error(`${label} must be an unauthenticated loopback HTTP URL.`);
  }
  return url;
}

export function containedPath(root, relative) {
  const resolvedRoot = path.resolve(root);
  const result = path.resolve(resolvedRoot, relative);
  const boundary = path.relative(resolvedRoot, result);
  if (!boundary || boundary.startsWith("..") || path.isAbsolute(boundary)) throw new Error("Path must remain inside its campaign directory.");
  return result;
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

export async function readCampaignSourceEnv(repoRoot) {
  const result = {};
  // Same practical precedence as Next's development environment; never log values.
  for (const name of [".env", ".env.development", ".env.local", ".env.development.local"]) {
    const file = path.join(repoRoot, name);
    if (await exists(file)) Object.assign(result, dotenv.parse(await readFile(file)));
  }
  return { ...result, ...process.env };
}

/** Explicit empty strings keep Next's dotenv loader from restoring production credentials. */
export function buildCampaignEnv({ sourceEnv, databaseUrl, baseUrl, openaiBaseUrl, gatewayToken, runtimeDir, blobApiUrl, blobToken, authSecret, appPort }) {
  requireLoopbackUrl(baseUrl, "Application URL");
  requireLoopbackUrl(openaiBaseUrl, "Budget gateway");
  requireLoopbackUrl(blobApiUrl, "Blob API");
  const database = new URL(databaseUrl);
  if (database.hostname !== "127.0.0.1" || database.pathname !== `/${DATABASE}` || database.username !== ROLE) throw new Error("Only the disposable campaign database is allowed.");
  const env = { ...process.env };
  for (const [key, value] of Object.entries(sourceEnv)) {
    // Keep model, quality, timeout and feature configuration; deny credential inheritance.
    if (/^(?:OPENAI_CONCIERGE_|CONCIERGE_|STUDIO_OPENAI_)/.test(key) && !/(?:KEY|TOKEN|SECRET|URL|BASE)/.test(key)) env[key] = value;
    else if (!(key in process.env) || /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|CLIENT_ID|DATABASE_URL|SMTP_|GOOGLE|MICROSOFT|AZURE|RESEND|AWS|SUPABASE|BLOB_|NEXT_PUBLIC_|APP_URL|PUBLIC_BASE_URL|NEXTAUTH_URL|AUTH_URL|PGSSL|NODE_OPTIONS)/.test(key)) env[key] = "";
  }
  Object.assign(env, {
    NODE_ENV: "development", PORT: String(appPort), HOSTNAME: "127.0.0.1",
    DATABASE_URL: databaseUrl, PGSSL_DISABLE_VERIFY: "", PGSSL_CA_BASE64: "", PG_POOL_MAX: "4",
    AUTH_SECRET: authSecret, NEXTAUTH_SECRET: authSecret, NEXTAUTH_URL: baseUrl,
    NEXTAUTH_URL_INTERNAL: baseUrl, NEXT_PUBLIC_APP_URL: baseUrl, NEXT_PUBLIC_BASE_URL: baseUrl,
    APP_URL: baseUrl, PUBLIC_BASE_URL: baseUrl,
    OPENAI_API_KEY: gatewayToken || "campaign-gateway-only", OPENAI_BASE_URL: openaiBaseUrl,
    STUDIO_PROVIDER: "openai", BLOB_READ_WRITE_TOKEN: blobToken,
    VERCEL_BLOB_API_URL: blobApiUrl, NEXT_PUBLIC_VERCEL_BLOB_API_URL: "", VERCEL_BLOB_RETRIES: "0",
    SMTP_HOST: "", SMTP_USER: "", SMTP_PASS: "", SMTP_PASSWORD: "",
    ENVITEFY_CAMPAIGN_RUNTIME_DIR: runtimeDir, ENVITEFY_CAMPAIGN_MAIL_DIR: path.join(runtimeDir, "mail"),
    NEXT_TELEMETRY_DISABLED: "1", NODE_OPTIONS: "",
  });
  return env;
}

function run(binary, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true, shell: false, stdio: ["ignore", "pipe", "pipe"], ...options });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolve(output) : reject(new Error(`${path.basename(binary)} exited ${code}: ${output.slice(-2000)}`)));
  });
}

async function findPgBin(explicit) {
  const candidates = [explicit, process.env.CAMPAIGN_PG_BIN, "C:/Program Files/PostgreSQL/18/bin", "C:/Program Files/PostgreSQL/17/bin"].filter(Boolean);
  for (const dir of candidates) if (await exists(path.join(dir, process.platform === "win32" ? "initdb.exe" : "initdb"))) return dir;
  throw new Error("PostgreSQL binaries unavailable. Supply pgBin; no configured remote database will be used.");
}

async function startDatabase({ repoRoot, runtimeDir, secrets, pgPort, pgBin }) {
  const binDir = await findPgBin(pgBin);
  const binary = name => path.join(binDir, `${name}${process.platform === "win32" ? ".exe" : ""}`);
  const dataDir = containedPath(runtimeDir, "postgres");
  const pgPasswordFile = containedPath(runtimeDir, "postgres-init-password.txt");
  const databaseUrl = `postgresql://${ROLE}:${encodeURIComponent(secrets.databasePassword)}@127.0.0.1:${pgPort}/${DATABASE}`;
  if (!await exists(path.join(dataDir, "PG_VERSION"))) {
    await writeFile(pgPasswordFile, secrets.databasePassword, { mode: 0o600 });
    try {
      await run(binary("initdb"), ["-D", dataDir, "-U", ROLE, "--pwfile", pgPasswordFile, "--auth-host=scram-sha-256", "--auth-local=scram-sha-256", "--encoding=UTF8", "--locale=C"]);
    } finally { await unlink(pgPasswordFile).catch(() => {}); }
  }
  let alreadyRunning = false;
  try { await run(binary("pg_ctl"), ["-D", dataDir, "status"]); alreadyRunning = true; } catch { /* Stopped owned cluster. */ }
  if (!alreadyRunning) await run(binary("pg_ctl"), ["-D", dataDir, "-l", path.join(runtimeDir, "postgres.log"), "-o", `-h 127.0.0.1 -p ${pgPort} -c max_connections=30`, "-w", "start"]);
  const admin = new pg.Client({ connectionString: databaseUrl.replace(`/${DATABASE}`, "/postgres"), connectionTimeoutMillis: 5000 });
  await admin.connect();
  try {
    const present = await admin.query("select 1 from pg_database where datname = $1", [DATABASE]);
    if (!present.rowCount) await admin.query(`create database ${DATABASE}`);
  } finally { await admin.end(); }
  const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    const schemas = ["init_db_pgcrypto.sql", "20260305_rsvp_bootstrap.sql", "20260430_add_event_assets_conversations.sql", "20260606_add_dynamic_event_pages.sql", "20260901_add_legal_privacy_controls.sql"];
    for (const schema of schemas) await client.query(await readFile(path.join(repoRoot, "prisma/manual_sql", schema), "utf8"));
    for (const account of secrets.accounts) {
      const salt = randomBytes(16);
      const hash = `${salt.toString("hex")}:${scryptSync(account.password, salt, 64).toString("hex")}`;
      const persona = { mom: "parents_moms", teacher: "educators", coach: "sports_staff", gymnast: "sports_staff", general: "general" }[account.persona];
      const visibility = { v: 3, persona, personas: [persona], visibleTemplateKeys: TEMPLATE_KEYS, defaultCreateIntent: null,
        sportPreferences: { primarySport: account.persona === "gymnast" ? "gymnastics" : "football", enabledSports: ["gymnastics", "football", "dance_ballet", "cheerleading", "basketball", "baseball", "softball", "soccer", "volleyball", "hockey", "lacrosse", "tennis", "track_field", "swimming", "wrestling"], setupCompleted: true } };
      const result = await client.query(`insert into users (email,first_name,last_name,password_hash,is_admin,primary_signup_source,product_scopes,feature_visibility)
        values ($1,$2,'Campaign',$3,false,'legacy',ARRAY['snap','gymnastics']::text[],$4::jsonb)
        on conflict (email) do update set password_hash=excluded.password_hash returning id`,
      [account.email, account.persona, hash, JSON.stringify(visibility)]);
      account.id = result.rows[0].id;
    }
  } finally { await client.end(); }
  return { databaseUrl, stop: () => run(binary("pg_ctl"), ["-D", dataDir, "-m", "fast", "-w", "stop"]) };
}

function json(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
}

async function readBody(request, limit = 35 * 1024 * 1024) {
  const chunks = []; let size = 0;
  for await (const chunk of request) { size += chunk.length; if (size > limit) throw new Error("Campaign upload exceeds 35 MB."); chunks.push(chunk); }
  return Buffer.concat(chunks);
}

async function listen(server, port) {
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve); });
  return server.address().port;
}

function close(server) {
  return new Promise(resolve => { server.closeAllConnections?.(); server.close(resolve); });
}

/** Storage boundary only; content and application generation are not mocked. */
export async function startCampaignStorage({ runtimeDir, token, baseUrl, port = 4317, mediaPrefix = "/__campaign-media/" }) {
  requireLoopbackUrl(baseUrl);
  const blobRoot = containedPath(runtimeDir, "blobs");
  await mkdir(blobRoot, { recursive: true });
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      if (request.headers.authorization !== `Bearer ${token}`) return json(response, 401, { error: { code: "forbidden", message: "Campaign token required." } });
      if (request.method !== "PUT" || url.pathname !== "/") return json(response, 501, { error: { code: "not_supported", message: "Campaign storage supports public single-part puts only." } });
      if (request.headers["x-vercel-blob-access"] === "private") return json(response, 400, { error: { code: "bad_request", message: "Cannot use private access on a public store" } });
      const requested = url.searchParams.get("pathname") || "";
      if (!requested || requested.includes("\\") || requested.split("/").some(part => !part || part === "." || part === "..")) throw new Error("Invalid campaign blob pathname.");
      const parsed = path.posix.parse(requested);
      const pathname = request.headers["x-add-random-suffix"] === "0" ? requested : path.posix.join(parsed.dir, `${parsed.name}-${randomUUID()}${parsed.ext}`);
      const file = containedPath(blobRoot, pathname);
      const bytes = await readBody(request);
      const contentType = request.headers["x-content-type"] || "application/octet-stream";
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, bytes);
      const urlPath = `${mediaPrefix}${pathname.split("/").map(encodeURIComponent).join("/")}`;
      const assetUrl = `${baseUrl}${urlPath}`;
      return json(response, 200, { url: assetUrl, downloadUrl: `${assetUrl}?download=1`, pathname, contentType, contentDisposition: "inline", etag: createHash("sha256").update(bytes).digest("hex") });
    } catch (error) { return json(response, 400, { error: { code: "bad_request", message: error.message } }); }
  });
  const actualPort = await listen(server, port);
  return { blobRoot, mediaPrefix, url: `http://127.0.0.1:${actualPort}`, stop: () => close(server) };
}

export async function startCampaignWebProxy({ port, appPort, blobRoot, mediaPrefix = "/__campaign-media/" }) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    // Next's internal relative-image fetch bypasses this front proxy. Resolve
    // only campaign media optimizer requests here, serving the actual stored
    // WebP unchanged; all ordinary application images still use Next normally.
    const optimizedSource = url.pathname === "/_next/image" ? url.searchParams.get("url") : null;
    let mediaPath = url.pathname.startsWith(mediaPrefix) ? url.pathname : null;
    if (optimizedSource?.startsWith(mediaPrefix)) mediaPath = new URL(optimizedSource, "http://127.0.0.1").pathname;
    if (mediaPath) {
      try {
        const relative = decodeURIComponent(mediaPath.slice(mediaPrefix.length));
        if (relative.includes("\\") || relative.split("/").some(part => !part || part === "." || part === "..")) throw new Error("Invalid path");
        const file = containedPath(blobRoot, relative);
        const metadata = await stat(file);
        if (!metadata.isFile()) throw new Error("Not a file");
        response.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Content-Length": metadata.size, "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
        if (request.method === "HEAD") return response.end();
        return createReadStream(file).pipe(response);
      } catch { response.writeHead(404); return response.end("Not found"); }
    }
    const upstream = httpRequest({ hostname: "127.0.0.1", port: appPort, path: request.url, method: request.method, headers: { ...request.headers, "x-forwarded-host": request.headers.host, "x-forwarded-proto": "http" } }, upstreamResponse => {
      response.writeHead(upstreamResponse.statusCode, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    });
    upstream.on("error", () => { if (!response.headersSent) response.writeHead(503); response.end("Campaign application is starting."); });
    request.pipe(upstream);
  });
  server.on("upgrade", (request, socket, head) => {
    const upstream = netConnect(appPort, "127.0.0.1", () => {
      upstream.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${Object.entries(request.headers).map(([key, value]) => `${key}: ${value}`).join("\r\n")}\r\n\r\n`);
      if (head.length) upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });
    upstream.on("error", () => socket.destroy());
    socket.on("error", () => upstream.destroy());
  });
  await listen(server, port);
  return { stop: () => close(server) };
}

/** Starts only owned loopback infrastructure. Caller separately launches Next with returned env. */
export async function prepareCampaignEnvironment({ runDir, repoRoot = process.cwd(), baseUrl = "http://127.0.0.1:3107", appPort = 3108, pgPort = 55439, blobPort = 4317, openaiBaseUrl, gatewayToken, pgBin }) {
  const origin = requireLoopbackUrl(baseUrl, "Application URL");
  requireLoopbackUrl(openaiBaseUrl, "Budget gateway");
  if (origin.pathname !== "/") throw new Error("Application base URL must be an origin.");
  const campaignRoot = path.join(path.resolve(repoRoot), ".qa", "create-campaign");
  const resolvedRunDir = containedPath(campaignRoot, path.relative(campaignRoot, path.resolve(runDir)));
  const runtimeDir = containedPath(resolvedRunDir, "runtime");
  await mkdir(runtimeDir, { recursive: true });
  const markerPath = path.join(runtimeDir, MARKER);
  if (await exists(markerPath)) {
    const marker = JSON.parse(await readFile(markerPath, "utf8"));
    if (marker.kind !== "envitefy-create-campaign" || marker.runtimeDir !== runtimeDir || marker.pgPort !== pgPort) throw new Error("Campaign runtime marker does not match.");
  } else await writeFile(markerPath, JSON.stringify({ kind: "envitefy-create-campaign", runtimeDir, pgPort }, null, 2));
  const secretsPath = path.join(runtimeDir, "secrets.json");
  const secrets = await exists(secretsPath) ? JSON.parse(await readFile(secretsPath, "utf8")) : {
    authSecret: randomBytes(32).toString("base64url"), databasePassword: randomBytes(24).toString("base64url"),
    blobToken: `vercel_blob_rw_campaign_${randomBytes(24).toString("hex")}`,
    accounts: PERSONAS.map(persona => ({ persona, email: `${persona}@create-campaign.example.test`, password: randomBytes(24).toString("base64url") })),
  };
  await writeFile(secretsPath, JSON.stringify(secrets, null, 2), { mode: 0o600 });
  await mkdir(path.join(runtimeDir, "mail"), { recursive: true });
  const database = await startDatabase({ repoRoot, runtimeDir, secrets, pgPort, pgBin });
  await writeFile(secretsPath, JSON.stringify(secrets, null, 2), { mode: 0o600 });
  let storage; let proxy;
  try {
    storage = await startCampaignStorage({ runtimeDir, token: secrets.blobToken, baseUrl: origin.origin, port: blobPort });
    proxy = await startCampaignWebProxy({ port: Number(origin.port || 80), appPort, blobRoot: storage.blobRoot });
  } catch (error) { await storage?.stop(); await database.stop(); throw error; }
  const sourceEnv = await readCampaignSourceEnv(repoRoot);
  const env = buildCampaignEnv({ sourceEnv, databaseUrl: database.databaseUrl, baseUrl: origin.origin, openaiBaseUrl, gatewayToken, runtimeDir, blobApiUrl: storage.url, blobToken: secrets.blobToken, authSecret: secrets.authSecret, appPort });
  await writeFile(path.join(runtimeDir, "environment-summary.json"), JSON.stringify({ baseUrl: origin.origin, appPort, pgPort, blobApiUrl: storage.url, database: "disposable-local-postgres", mail: "local-eml-capture", accounts: secrets.accounts.map(({ persona, email, id }) => ({ persona, email, id })), limitations: ["External calendar OAuth and delivery are not exercised.", "Blob service emulates public single-part storage; private blob security is not evaluated."] }, null, 2));
  const databaseCounts = async email => {
    if (!secrets.accounts.some(account => account.email === email)) throw new Error("Counts are limited to the synthetic campaign accounts.");
    const client = new pg.Client({ connectionString: database.databaseUrl, connectionTimeoutMillis: 5000 });
    await client.connect();
    try {
      const result = await client.query(`select
        (select count(*)::int from creation_sessions where user_id=u.id) as "creationSessions",
        (select count(*)::int from event_history where user_id=u.id) as events
        from users u where u.email=$1`, [email]);
      return result.rows[0];
    } finally { await client.end(); }
  };
  return { env, accounts: secrets.accounts, databaseUrl: database.databaseUrl, runtimeDir, baseUrl: origin.origin, appPort, databaseCounts, shutdown: async () => { await proxy.stop(); await storage.stop(); await database.stop(); } };
}
