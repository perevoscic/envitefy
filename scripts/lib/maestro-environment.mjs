import { spawn } from "node:child_process";
import { createHash, randomBytes, randomUUID, scryptSync } from "node:crypto";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import pg from "pg";
import { request } from "playwright";
import sharp from "sharp";
import {
  buildCampaignEnv,
  readCampaignSourceEnv,
  startCampaignStorage,
  startCampaignWebProxy,
} from "./create-campaign-environment.mjs";
import { appOrigin } from "./maestro-config.mjs";
import {
  contained,
  DISABLED_ACCOUNTS,
  localOrigin,
  ROOT,
  runProcess,
  SCENARIOS,
} from "./maestro-core.mjs";

export async function startEnvironment(runDir) {
  const runtimeDir = contained(runDir, "runtime");
  await mkdir(runtimeDir, { recursive: true });
  const baseUrl = localOrigin("http://127.0.0.1:3217");
  const appPort = 3218;
  const pgPort = 55447;
  const pgBin =
    process.env.MAESTRO_PG_BIN ||
    path.join(ROOT, ".tools/postgres/node_modules/@embedded-postgres/windows-x64/native/bin");
  const suffix = process.platform === "win32" ? ".exe" : "";
  await access(path.join(pgBin, `initdb${suffix}`));
  const databasePassword = randomBytes(24).toString("base64url");
  const accounts = SCENARIOS.map((item) =>
    DISABLED_ACCOUNTS.has(item.account)
      ? { alias: item.account, disabled: true, id: null, email: "", password: "" }
      : {
          alias: item.account,
          id: randomUUID(),
          email: `${item.account.toLowerCase()}@maestro.example.test`,
          password: randomBytes(24).toString("base64url"),
          role: item.role,
        },
  );
  const secrets = {
    databasePassword,
    accounts,
    authSecret: randomBytes(32).toString("base64url"),
    blobToken: `vercel_blob_rw_maestro_${randomBytes(24).toString("hex")}`,
  };
  const passwordFile = path.join(runtimeDir, "postgres-password.txt");
  await writeFile(passwordFile, databasePassword, { mode: 0o600 });
  const dbDir = path.join(runtimeDir, "postgres");
  const execPg = async (name, args) => {
    const result = await runProcess(path.join(pgBin, `${name}${suffix}`), args, {
      timeoutMs: 60000,
      secrets: [databasePassword],
    });
    if (result.exitCode !== 0) throw new Error(`${name}: ${result.output}`);
    return result;
  };
  let databaseStarted = false;
  let storage;
  let proxy;
  let next;
  let gateway;
  const tsconfigFile = path.join(ROOT, "tsconfig.application.json");
  const originalTsconfig = await readFile(tsconfigFile, "utf8");
  const restoreGeneratedTsconfig = async () => {
    const currentText = await readFile(tsconfigFile, "utf8");
    if (currentText === originalTsconfig) return;
    const current = JSON.parse(currentText);
    const before = JSON.parse(originalTsconfig);
    const normalize = (value) => ({
      ...value,
      include: (value.include || [])
        .filter((item) => item !== ".next-dev-3218/types/**/*.ts")
        .sort(),
    });
    if (JSON.stringify(normalize(current)) === JSON.stringify(normalize(before)))
      await writeFile(tsconfigFile, originalTsconfig);
  };
  const shutdown = async () => {
    if (next?.pid) {
      if (process.platform === "win32")
        await runProcess("taskkill.exe", ["/pid", String(next.pid), "/t", "/f"], {
          timeoutMs: 15000,
        });
      else next.kill("SIGTERM");
    }
    await proxy?.stop();
    await storage?.stop();
    if (gateway) {
      gateway.closeAllConnections();
      await new Promise((resolve) => gateway.close(resolve));
    }
    if (databaseStarted) await execPg("pg_ctl", ["-D", dbDir, "-m", "fast", "-w", "stop"]);
    await restoreGeneratedTsconfig();
  };
  try {
    await execPg("initdb", [
      "-D",
      dbDir,
      "-U",
      "envitefy_campaign",
      "--pwfile",
      passwordFile,
      "--auth-host=scram-sha-256",
      "--auth-local=scram-sha-256",
      "--encoding=UTF8",
      "--locale=C",
    ]);
    await unlink(passwordFile);
    await execPg("pg_ctl", [
      "-D",
      dbDir,
      "-l",
      path.join(runtimeDir, "postgres.log"),
      "-o",
      `-h 127.0.0.1 -p ${pgPort} -c max_connections=30`,
      "-w",
      "start",
    ]);
    databaseStarted = true;
    const databaseUrl = `postgresql://envitefy_campaign:${encodeURIComponent(databasePassword)}@127.0.0.1:${pgPort}/envitefy_create_campaign`;
    const admin = new pg.Client({
      connectionString: databaseUrl.replace("/envitefy_create_campaign", "/postgres"),
      connectionTimeoutMillis: 5000,
    });
    await admin.connect();
    try {
      await admin.query("create database envitefy_create_campaign");
    } finally {
      await admin.end();
    }
    const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 });
    await client.connect();
    try {
      for (const file of [
        "init_db_pgcrypto.sql",
        "20260305_rsvp_bootstrap.sql",
        "20260430_add_event_assets_conversations.sql",
        "20260606_add_dynamic_event_pages.sql",
        "20260901_add_legal_privacy_controls.sql",
        "20261002_event_collaboration.sql",
        "20261006_signup_host_alerts.sql",
      ]) {
        await client.query(await readFile(path.join(ROOT, "prisma/manual_sql", file), "utf8"));
      }
      for (const account of accounts.filter((item) => !item.disabled)) {
        const salt = randomBytes(16).toString("hex");
        const hash = `${salt}:${scryptSync(account.password, Buffer.from(salt, "hex"), 64).toString("hex")}`;
        await client.query(
          `insert into users (id,email,first_name,last_name,password_hash,is_admin,primary_signup_source,product_scopes,feature_visibility)
          values ($1,$2,$3,'Maestro',$4,false,'legacy',ARRAY['snap','gymnastics']::text[],$5::jsonb)`,
          [
            account.id,
            account.email,
            account.alias,
            hash,
            JSON.stringify({
              v: 3,
              persona: "general",
              personas: ["general"],
              visibleTemplateKeys: [
                "birthdays",
                "weddings",
                "anniversaries",
                "baby_showers",
                "gender_reveal",
                "sport_events",
                "gymnastics",
                "football_season",
                "signup_forms",
                "general",
              ],
              sportPreferences: {
                primarySport: "football",
                enabledSports: ["football", "gymnastics"],
                setupCompleted: true,
              },
            }),
          ],
        );
      }
      await writeFile(path.join(runtimeDir, "secrets.json"), JSON.stringify(secrets), {
        mode: 0o600,
      });
      const fixtureInput = path.join(runtimeDir, "fixture-input.json");
      const fixtureOutput = path.join(runtimeDir, "fixtures.json");
      await writeFile(
        fixtureInput,
        JSON.stringify({
          baseUrl,
          accounts: accounts.map(({ id, alias, email }) => ({ id, alias, email })),
        }),
      );
      const bun =
        process.env.MAESTRO_BUN_BIN ||
        (process.platform === "win32"
          ? path.join(process.env.APPDATA, "npm/node_modules/bun/bin/bun.exe")
          : "bun");
      const fixturesResult = await runProcess(
        bun,
        ["scripts/maestro-fixtures.ts", fixtureInput, fixtureOutput],
        { timeoutMs: 60000 },
      );
      if (fixturesResult.exitCode !== 0)
        throw new Error(`Fixture adapters: ${fixturesResult.output}`);
      const fixtures = JSON.parse(await readFile(fixtureOutput, "utf8"));
      for (const event of fixtures.events) {
        event.id = randomUUID();
        if (event.key === "private scan") {
          const bytes = await sharp(
            Buffer.from(
              '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="white"/><text x="30" y="80" font-size="28">Synthetic Patient</text><text x="30" y="130" font-size="24">Synthetic Clinician</text></svg>',
            ),
          )
            .png()
            .toBuffer();
          event.data.attachment = {
            name: "synthetic-appointment.png",
            type: "image/png",
            dataUrl: `data:image/png;base64,${bytes.toString("base64")}`,
          };
          event.data.createdVia = "ocr";
          event.data.ocrFacts = [
            { label: "Patient", value: "Synthetic Patient" },
            { label: "Clinician", value: "Synthetic Clinician" },
          ];
        }
        await client.query(
          "insert into event_history(id,user_id,title,data) values($1,$2,$3,$4::jsonb)",
          [event.id, event.owner, event.title, JSON.stringify(event.data)],
        );
      }
      await writeFile(fixtureOutput, JSON.stringify(fixtures, null, 2));
      const key = (name) => fixtures.events.find((item) => item.key === name);
      for (const [name, index] of [
        ["cohost invitation", 8],
        ["cohost signup", 9],
      ]) {
        const event = key(name);
        await client.query(
          `insert into event_collaborator_invites(event_id,invited_by,email,token_hash,expires_at,email_status)
          values($1,$2,$3,$4,now()+interval '7 days','sent')`,
          [
            event.id,
            event.owner,
            accounts[index].email,
            createHash("sha256").update(randomBytes(32)).digest("hex"),
          ],
        );
      }
      // Each scenario receives its own records; no scenario depends on a prior flow.
      const target = [
        null,
        key("draft invitation"),
        key("published invitation"),
        null,
        key("private scan"),
        key("host signup"),
        key("participant signup"),
        key("waitlist signup"),
        key("cohost invitation"),
        key("cohost signup"),
        key("calendar invitation"),
        key("private scan"),
      ];
      accounts.forEach((account, index) => {
        account.eventId = target[index]?.id || "";
        account.eventTitle = target[index]?.title || "";
      });
      accounts[4].eventTitle = "Synthetic medical appointment";
      await writeFile(path.join(runtimeDir, "secrets.json"), JSON.stringify(secrets), {
        mode: 0o600,
      });
      storage = await startCampaignStorage({
        runtimeDir,
        token: secrets.blobToken,
        baseUrl,
        port: 4327,
      });
      await mkdir(storage.blobRoot, { recursive: true });
      await sharp({ create: { width: 600, height: 900, channels: 3, background: "#c8dccc" } })
        .webp()
        .toFile(path.join(storage.blobRoot, "fixture.webp"));
      proxy = await startCampaignWebProxy({ port: 3217, appPort, blobRoot: storage.blobRoot });
      gateway = createServer((_req, res) => {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: {
              message: "Live AI generation is excluded from the offline Maestro regression suite.",
            },
          }),
        );
      });
      await new Promise((resolve) => gateway.listen(4328, "127.0.0.1", resolve));
      const env = buildCampaignEnv({
        sourceEnv: await readCampaignSourceEnv(ROOT),
        databaseUrl,
        baseUrl,
        openaiBaseUrl: "http://127.0.0.1:4328/v1",
        gatewayToken: "maestro-offline-only",
        runtimeDir,
        blobApiUrl: storage.url,
        blobToken: secrets.blobToken,
        authSecret: secrets.authSecret,
        appPort,
      });
      // Reuse the existing development-only mail adapter without weakening its
      // ownership/path guard or changing production transport behavior.
      const mailRuntime = contained(
        path.join(ROOT, ".qa/create-campaign"),
        `maestro-mail-${path.basename(runDir)}`,
      );
      await mkdir(path.join(mailRuntime, "mail"), { recursive: true });
      await writeFile(
        path.join(mailRuntime, ".campaign-runtime.json"),
        JSON.stringify({ kind: "envitefy-create-campaign", runtimeDir: mailRuntime }),
      );
      env.ENVITEFY_CAMPAIGN_RUNTIME_DIR = mailRuntime;
      env.ENVITEFY_CAMPAIGN_MAIL_DIR = path.join(mailRuntime, "mail");
      // Prevent Next's dotenv loader restoring remote credentials that were absent
      // from process.env. buildCampaignEnv blanks all configured secret fields.
      env.HOSTNAME = "127.0.0.1";
      next = spawn(
        process.execPath,
        ["scripts/dev-single.js", "--hostname", "127.0.0.1", "--port", String(appPort)],
        { cwd: ROOT, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
      );
      const logFile = path.join(runtimeDir, "next.log");
      let logs = "";
      const capture = (chunk) => {
        logs += chunk.toString();
        void writeFile(logFile, logs);
      };
      next.stdout.on("data", capture);
      next.stderr.on("data", capture);
      let ready = false;
      const deadline = Date.now() + 180000;
      while (Date.now() < deadline && next.exitCode === null) {
        try {
          const response = await fetch(`${baseUrl}/api/auth/providers`, {
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) {
            ready = true;
            break;
          }
        } catch {
          /* Cold compilation. */
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (!ready)
        throw new Error(
          "Local Envitefy startup did not pass /api/auth/providers within 180 seconds. See runtime/next.log.",
        );
      await restoreGeneratedTsconfig();
      await writeFile(
        path.join(runDir, "environment.json"),
        JSON.stringify(
          {
            kind: "envitefy-maestro-local",
            baseUrl,
            appPort,
            pgPort,
            accounts: accounts.map(({ alias, role, email, eventId }) => ({
              alias,
              role,
              email,
              eventId,
            })),
            limitations: [
              "Live AI generation and OCR providers are disabled.",
              "Scan data and existing artwork are seeded; file upload/provider extraction is not certified.",
              "Email is captured locally; live Zoho delivery is not certified.",
              "External calendar OAuth is not connected.",
            ],
          },
          null,
          2,
        ),
      );
      return {
        baseUrl,
        accounts,
        runtimeDir,
        fixtures,
        databaseUrl,
        shutdown,
        secretValues: [
          databasePassword,
          secrets.authSecret,
          secrets.blobToken,
          ...accounts.map((account) => account.password),
        ],
      };
    } finally {
      await client.end();
    }
  } catch (error) {
    error.maestroSecrets = [
      databasePassword,
      secrets.authSecret,
      secrets.blobToken,
      ...accounts.map((account) => account.password),
    ];
    await shutdown();
    throw error;
  }
}

export async function authenticatedRequest(baseUrl, account) {
  if (account.authProvider === "google")
    throw new Error("Google tester credentials must not be sent to Envitefy's password endpoint.");
  appOrigin(baseUrl);
  const context = await request.newContext({ baseURL: baseUrl, timeout: 180000 });
  try {
    const csrfResponse = await context.get("/api/auth/csrf");
    const { csrfToken } = await csrfResponse.json();
    await context.post("/api/auth/callback/credentials", {
      form: {
        csrfToken,
        email: account.email,
        password: account.password,
        json: "true",
        callbackUrl: `${baseUrl}/`,
      },
    });
    const session = await (await context.get("/api/auth/session")).json();
    if (session.user?.email !== account.email)
      throw new Error(`Credentials did not establish ${account.alias}'s test session.`);
    if (session.user?.id) account.id = session.user.id;
    return context;
  } catch (error) {
    await context.dispose();
    throw error;
  }
}

export async function warmScenario(environment, scenario, account) {
  const context = await authenticatedRequest(environment.baseUrl, account);
  const target =
    {
      "02": `/live-cards?edit=${account.eventId}`,
      "03": `/live-cards?edit=${account.eventId}`,
      "04": "/event/general/customize?templateId=coffee-conversation",
      "05": `/event/${account.eventId}`,
      "06": `/smart-signup-form/${account.eventId}`,
      "07": `/smart-signup-form/${account.eventId}`,
      "08": `/smart-signup-form/${account.eventId}`,
      "09": "/",
      10: "/",
      11: `/card/${account.eventId}`,
      12: `/event/${account.eventId}`,
    }[scenario.id.slice(0, 2)] || "/";
  try {
    for (const route of [
      "/mobile/sign-in?challenge=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&state=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "/",
      target,
    ]) {
      const response = await context.get(route);
      if (response.status() >= 500)
        throw new Error(`Local route preparation returned HTTP ${response.status()} for ${route}.`);
    }
  } finally {
    await context.dispose();
  }
}
