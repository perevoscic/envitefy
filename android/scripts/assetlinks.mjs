import { X509Certificate } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const assetlinksPath = fileURLToPath(new URL("../../public/.well-known/assetlinks.json", import.meta.url));
const packageName = "com.envitefy.app";
const relation = "delegate_permission/common.handle_all_urls";

export function normalizeFingerprint(value) {
  const hex = value.replace(/:/g, "").trim();
  if (!/^[a-f\d]{64}$/i.test(hex)) {
    throw new Error("Supply a real SHA-256 certificate fingerprint (32 bytes), not a placeholder or SHA-1 fingerprint.");
  }
  return hex.toUpperCase().match(/.{2}/g).join(":");
}

export function hasAssociation(statements, fingerprint) {
  const expected = normalizeFingerprint(fingerprint);
  return Array.isArray(statements) && statements.some((entry) =>
    entry?.target?.namespace === "android_app" &&
    entry.target.package_name === packageName &&
    entry.relation?.includes(relation) &&
    Array.isArray(entry.target.sha256_cert_fingerprints) &&
    entry.target.sha256_cert_fingerprints.some((value) => normalizeFingerprint(value) === expected),
  );
}

export function addAssociation(statements, fingerprint) {
  if (!Array.isArray(statements)) throw new Error("assetlinks.json must contain an array.");
  const normalized = normalizeFingerprint(fingerprint);
  const result = structuredClone(statements);
  if (hasAssociation(result, normalized)) return result;
  const existing = result.find((entry) =>
    entry?.target?.namespace === "android_app" &&
    entry.target.package_name === packageName && entry.relation?.includes(relation),
  );
  if (existing) {
    if (!Array.isArray(existing.target.sha256_cert_fingerprints)) {
      throw new Error("Existing Envitefy association has invalid certificate data; inspect it before editing.");
    }
    existing.target.sha256_cert_fingerprints.push(normalized);
  } else {
    result.push({ relation: [relation], target: {
      namespace: "android_app", package_name: packageName,
      sha256_cert_fingerprints: [normalized],
    } });
  }
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--write" || arg === "--check-live") options[arg] = true;
    else if (arg === "--certificate" || arg === "--fingerprint") {
      if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`${arg} needs a value.`);
      options[arg] = args[++index];
    } else throw new Error(`Unsupported argument: ${arg}`);
  }
  if (Boolean(options["--certificate"]) === Boolean(options["--fingerprint"])) {
    throw new Error("Usage: node android/scripts/assetlinks.mjs (--certificate path.cer | --fingerprint SHA256) [--write | --check-live]");
  }
  if (options["--write"] && options["--check-live"]) throw new Error("Write and live verification are separate steps; deploy the website between them.");
  const fingerprint = normalizeFingerprint(options["--certificate"]
    ? new X509Certificate(readFileSync(resolve(options["--certificate"]))).fingerprint256
    : options["--fingerprint"]);
  if (options["--check-live"]) {
    const response = await fetch("https://envitefy.com/.well-known/assetlinks.json", {
      redirect: "manual", signal: AbortSignal.timeout(15000),
    });
    if (response.status !== 200 || !response.headers.get("content-type")?.includes("application/json")) {
      throw new Error(`Expected public JSON with HTTP 200 and no redirect; received HTTP ${response.status}.`);
    }
    if (!hasAssociation(await response.json(), fingerprint)) throw new Error("Live website does not yet associate com.envitefy.app with this certificate. Deploy the correct assetlinks.json first.");
    console.log(`Live association verified for ${packageName}: ${fingerprint}`);
    return;
  }
  const statements = JSON.parse(readFileSync(assetlinksPath, "utf8"));
  if (options["--write"]) {
    writeFileSync(assetlinksPath, `${JSON.stringify(addAssociation(statements, fingerprint), null, 2)}\n`);
    console.log(`Added ${packageName}: ${fingerprint}. Existing associations preserved. Website deployment is still required.`);
  } else {
    if (!hasAssociation(statements, fingerprint)) throw new Error("Local assetlinks.json does not contain this package/certificate association.");
    console.log(`Local association verified for ${packageName}: ${fingerprint}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
