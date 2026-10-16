import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import { ROOT, SCENARIOS } from "./maestro-core.mjs";

export function appOrigin(value) {
  const url = new URL(value);
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (
    !(url.protocol === "https:" || (local && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("MAESTRO_BASE_URL must be an HTTPS origin, or a loopback HTTP origin.");
  return url.origin;
}

const resourceAccounts = new Set([
  "QA02",
  "QA03",
  "QA05",
  "QA06",
  "QA07",
  "QA08",
  "QA09",
  "QA10",
  "QA11",
  "QA12",
]);
const titleAccounts = new Set(["QA05", "QA09", "QA11"]);

export function configuredAccounts(values, scenarios = SCENARIOS) {
  const missing = [];
  const required = (name) => {
    const value = values[name]?.trim();
    if (!value || /^(?:REPLACE_|YOUR_|<)/.test(value)) missing.push(name);
    return value || "";
  };
  const origin = required("MAESTRO_BASE_URL");
  const aliases = new Set(scenarios.map((item) => item.account));
  // These identities own the records used by the independent permission checks.
  if (aliases.has("QA07") || aliases.has("QA08") || aliases.has("QA12")) aliases.add("QA06");
  if (aliases.has("QA09") || aliases.has("QA12")) aliases.add("QA02");
  if (aliases.has("QA12")) aliases.add("QA05");
  const accounts = SCENARIOS.map((scenario) => {
    const prefix = `MAESTRO_${scenario.account}_`;
    const get = (name, needed) => (needed ? required(prefix + name) : values[prefix + name] || "");
    const used = aliases.has(scenario.account);
    const password = get("PASSWORD", used);
    return {
      alias: scenario.account,
      role: scenario.role,
      email: get("EMAIL", used),
      // Do not trim passwords: spaces can be intentional.
      password: password ? values[`${prefix}PASSWORD`] : "",
      eventId: get("EVENT_ID", used && resourceAccounts.has(scenario.account)),
      eventTitle: get("EVENT_TITLE", used && titleAccounts.has(scenario.account)),
      patientName: get("PATIENT_NAME", used && scenario.account === "QA05"),
      clinicianName: get("CLINICIAN_NAME", used && scenario.account === "QA05"),
      slotLabel: get("SLOT_LABEL", used && ["QA06", "QA07", "QA08"].includes(scenario.account)),
      occupiedResponseId: get("OCCUPIED_RESPONSE_ID", used && scenario.account === "QA08"),
    };
  });
  if (missing.length)
    throw new Error(
      `Maestro configuration is incomplete. No app tests started. Missing variables:\n${missing.join("\n")}`,
    );
  for (const account of accounts.filter((item) => aliases.has(item.alias))) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email))
      throw new Error(`${account.alias}: invalid EMAIL.`);
    if (
      account.eventId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(account.eventId)
    )
      throw new Error(`${account.alias}: EVENT_ID must be an existing event UUID.`);
  }
  const usedAccounts = accounts.filter((item) => aliases.has(item.alias));
  if (new Set(usedAccounts.map((item) => item.email.toLowerCase())).size !== usedAccounts.length)
    throw new Error("Each account must have a different EMAIL.");
  if (aliases.has("QA12") && accounts[11].eventId !== accounts[4].eventId)
    throw new Error("QA12_EVENT_ID must equal QA05_EVENT_ID for the positive owner privacy check.");
  return {
    baseUrl: appOrigin(origin),
    accounts,
    secretValues: accounts.map((item) => item.password).filter(Boolean),
    configured: true,
  };
}

export async function loadConfiguredEnvironment(file = ".env.maestro.local", scenarios) {
  const absolute = path.resolve(ROOT, file);
  let values = {};
  try {
    values = parseEnv(await readFile(absolute, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  // Explicit process environment values override the file, as in normal CI use.
  return configuredAccounts({ ...values, ...process.env }, scenarios);
}
