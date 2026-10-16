import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAESTRO_VERSION = "2.11.0";
export const ROOT = path.resolve(import.meta.dirname, "../..");
export const ARTIFACT_ROOT = path.join(ROOT, "qa-artifacts/maestro");
export const SCENARIOS = [
  ["01-auth-onboarding", "Authentication and session", "account with no events"],
  ["02-livecard-create", "Live Card draft, resume and publish", "Live Card host"],
  ["03-livecard-edit", "Published Live Card editing", "returning host"],
  ["04-event-page", "Event Page section editing", "Event Page host"],
  ["05-snap-upload", "Scanned event and original document", "scan owner"],
  ["06-signup-host", "Sign-up host dashboard", "signup owner"],
  ["07-signup-participant", "Participant reservation, edit and cancellation", "participant"],
  ["08-signup-waitlist", "Waitlist and promotion", "waitlisted participant"],
  ["09-event-cohost", "Event invitation acceptance and permissions", "event co-host"],
  ["10-signup-cohost", "Form co-host editing and participants", "signup co-host"],
  ["11-dashboard-calendar", "Dashboard filters and calendar actions", "calendar user"],
  ["12-account-isolation", "Cross-account access denial", "unrelated user"],
].map(([id, name, role], index) => ({
  id,
  name,
  role,
  account: `QA${String(index + 1).padStart(2, "0")}`,
  file: `.maestro/flows/${id}.yaml`,
}));

export function localOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Maestro test environments must use a loopback HTTP origin.");
  }
  return url.origin;
}

export function contained(root, value) {
  const resolved = path.resolve(root, value);
  const relative = path.relative(path.resolve(root), resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error("Path must remain inside the test workspace.");
  return resolved;
}

export function redact(value, secrets = []) {
  const secretStrings = [
    ...new Set(secrets.filter((value) => typeof value === "string" && value.length > 0)),
  ].sort((a, b) => b.length - a.length);
  const plain = (input) => {
    let result = String(input);
    for (const secret of secretStrings) {
      result = result.split(JSON.stringify(secret).slice(1, -1)).join("[REDACTED]");
      result = result.split(secret).join("[REDACTED]");
    }
    return result
      .replace(/(Bearer\s+)[A-Za-z0-9._~-]+/gi, "$1[REDACTED]")
      .replace(
        /((?:password|token|secret|authorization)["']?\s*[:=]\s*)(["'])([^"'\r\n]*)(\2)/gi,
        "$1$2[REDACTED]$4",
      )
      .replace(
        /((?:password|token|secret|authorization)\s*[:=]\s*)([^\s,"'<>]+)/gi,
        "$1[REDACTED]",
      );
  };
  // Redact decoded JSON string values, preserving syntax even for short or
  // punctuation-only passwords and passwords escaped in Maestro input commands.
  const visit = (item) => {
    if (typeof item === "string") return plain(item);
    if (Array.isArray(item)) return item.map(visit);
    if (item && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item).map(([key, entry]) => [
          key,
          /(?:password|token|secret|authorization)$/i.test(key) ? "[REDACTED]" : visit(entry),
        ]),
      );
    return item;
  };
  try {
    const parsed = JSON.parse(String(value));
    if (parsed !== null && typeof parsed === "object")
      return JSON.stringify(visit(parsed), null, String(value).includes("\n") ? 2 : undefined);
  } catch {
    /* Non-JSON logs and reports are scrubbed as text. */
  }
  return plain(value);
}

export async function scrubArtifacts(dir, secrets) {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) await scrubArtifacts(file, secrets);
    else if (/\.(json|xml|log|txt|html|yaml|yml)$/i.test(entry.name)) {
      const value = await readFile(file, "utf8");
      const safe = redact(value, secrets);
      if (safe !== value) await writeFile(file, safe);
    }
  }
}

export async function runProcess(
  binary,
  args,
  { env = process.env, cwd = ROOT, timeoutMs = 300000, onOutput, secrets = [] } = {},
) {
  return new Promise((resolve) => {
    // .bat files require cmd on Windows. All CLI arguments are separately quoted;
    // credentials travel only through MAESTRO_ environment variables, never args.
    const batch = process.platform === "win32" && /\.(bat|cmd)$/i.test(binary);
    if (batch && [binary, ...args].some((value) => /["\r\n%&|<>^]/.test(String(value))))
      throw new Error("Unsafe Windows batch argument.");
    const child = spawn(
      batch ? "cmd.exe" : binary,
      batch
        ? ["/d", "/s", "/c", `"${[binary, ...args].map((value) => `"${value}"`).join(" ")}"`]
        : args,
      {
        cwd,
        env,
        windowsHide: true,
        windowsVerbatimArguments: batch,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let output = "";
    let timedOut = false;
    const capture = (chunk) => {
      const value = redact(chunk.toString(), secrets);
      output += value;
      onOutput?.(value);
    };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    let settled = false;
    const finish = (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdout.destroy();
      child.stderr.destroy();
      resolve({ exitCode: code, output: redact(output, secrets), timedOut });
    };
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === "win32")
        spawn("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], {
          windowsHide: true,
          stdio: "ignore",
        }).unref();
      child.kill("SIGTERM");
      child.unref();
      finish(null);
    }, timeoutMs);
    child.once("error", (error) => {
      clearTimeout(timer);
      resolve({
        exitCode: null,
        output: redact(error.message, secrets),
        timedOut,
        spawnError: error.code,
      });
    });
    child.once("close", finish);
    // pg_ctl can exit while its daemon still holds inherited pipe handles.
    child.once("exit", (code) => setTimeout(() => finish(code), 100));
  });
}

export async function maestroCommand() {
  const binary =
    process.env.MAESTRO_BIN ||
    path.join(
      ROOT,
      `.tools/maestro/${MAESTRO_VERSION}/maestro/bin/maestro${process.platform === "win32" ? ".bat" : ""}`,
    );
  const home = path.join(ARTIFACT_ROOT, "home");
  await mkdir(home, { recursive: true });
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("MAESTRO_")),
  );
  return {
    binary,
    env: {
      ...inherited,
      JAVA_OPTS: `-Duser.home=${home.replaceAll("\\", "/")}`,
      MAESTRO_CLI_NO_ANALYTICS: "1",
      MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true",
    },
  };
}

export async function snapshotFlow(scenario, artifactDir) {
  const source = path.join(ROOT, ".maestro");
  const target = contained(artifactDir, "source");
  const files = [
    `flows/${path.basename(scenario.file)}`,
    ...(await readdir(path.join(source, "shared")))
      .filter((name) => name.endsWith(".yaml"))
      .map((name) => `shared/${name}`),
  ].sort();
  const digest = createHash("sha256");
  for (const file of files) {
    const bytes = await readFile(path.join(source, file));
    digest.update(file).update("\0").update(bytes);
    const destination = contained(target, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
  }
  return {
    file: path.join(target, "flows", path.basename(scenario.file)),
    digest: digest.digest("hex"),
  };
}

export function fingerprint(result) {
  const normalized =
    `${result.failedStep || result.scenario}\n${result.message || result.classification}`
      .replace(/QA\d{2}/gi, "QA")
      .replace(/qa\d{2}[^\s"<>]*@[^\s"<>]+/gi, "[account]")
      .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "[id]")
      .replace(/127\.0\.0\.1:\d+/g, "127.0.0.1:[port]");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function classifyFailure({ timedOut, spawnError, output = "" }) {
  if (timedOut || /TimeoutException|timed out|exceeded .*seconds|within \d+ms/i.test(output))
    return "incomplete_check";
  if (
    spawnError ||
    /Unable to obtain|Unable to create driver|chrome.*not reachable|UnknownHostException|Connection refused|Invalid.*Flow|Invalid command|Failed to parse|NoSuchFileException/i.test(
      output,
    )
  )
    return "environment_or_test_failure";
  return "suspected_defect";
}
