import { spawn } from "node:child_process";
import { access, lstat, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SYSTEM_IMAGE = "system-images;android-34;google_apis_playstore;x86_64";
export const REFERENCE_DEVICES = [
  ["Samsung", "Galaxy S26 Ultra", "pixel_7_pro"],
  ["Samsung", "Galaxy S26+", "pixel_7_pro"],
  ["Samsung", "Galaxy Z Fold8 Ultra", "pixel_fold"],
  ["Samsung", "Galaxy Z Flip8", "6.7in Foldable"],
  ["Google", "Pixel 11 Pro XL", "pixel_7_pro"],
  ["Google", "Pixel 11 Pro Fold", "pixel_fold"],
  ["OPPO", "Find X10 Pro Max", "pixel_7_pro"],
  ["OPPO", "Find X10", "pixel_7"],
  ["Honor", "Magic9 Pro Max", "pixel_7_pro"],
  ["Honor", "Magic9", "pixel_7"],
  ["Honor", "Magic V6", "pixel_fold"],
  ["Xiaomi", "17 Ultra", "pixel_7_pro"],
  ["Xiaomi", "17T", "pixel_7"],
  ["Poco", "F9 Ultra", "pixel_7_pro"],
  ["Vivo", "X300 Ultra", "pixel_7_pro"],
  ["Motorola", "Razr Fold (2026)", "pixel_fold"],
  ["Motorola", "Edge 70 Fusion", "pixel_7"],
  ["Nothing", "Phone (4a) Pro", "pixel_7"],
  ["Sony", "Xperia 10 VIII", "pixel_7"],
  ["OnePlus", "16", "pixel_7_pro"],
];

function within(root, target) {
  const absolute = path.resolve(target);
  const relative = path.relative(path.resolve(root), absolute);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error("Fleet paths must remain inside the workspace.");
  return absolute;
}

async function exists(file) {
  try { await access(file); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function rejectSymlinks(root, target) {
  let current = within(root, target);
  while (current !== path.resolve(root)) {
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(`Refusing symlink in fleet path: ${current}`);
    } catch (error) { if (error.code !== "ENOENT") throw error; }
    current = path.dirname(current);
  }
}

export function credentialPresence(values) {
  const seen = new Map();
  return Object.fromEntries(REFERENCE_DEVICES.map((_, index) => {
    const account = `QA${String(index + 1).padStart(2, "0")}`;
    const email = values[`MAESTRO_${account}_EMAIL`]?.trim() || "";
    const password = values[`MAESTRO_${account}_PASSWORD`] || "";
    if (email) {
      const key = email.toLowerCase();
      if (seen.has(key)) throw new Error(`Duplicate credential identity: ${seen.get(key)} and ${account}.`);
      seen.set(key, account);
    }
    return [account, { emailPresent: Boolean(email), passwordPresent: Boolean(password) }];
  }));
}

export function buildManifest({ workspaceRoot = WORKSPACE, sdkRoot, presence = {}, previous = null, now = new Date().toISOString() }) {
  const root = path.resolve(workspaceRoot);
  if (!sdkRoot) throw new Error("Android SDK path is required.");
  if (previous && (previous.schemaVersion !== 1 || previous.kind !== "envitefy-android-qa-fleet"))
    throw new Error("Existing manifest has an unsupported schema; it was not overwritten.");
  const avdHome = within(root, path.join(root, ".tools/android/account-fleet/avd"));
  const profiles = REFERENCE_DEVICES.map(([referenceManufacturer, referenceModel, hardwareProfile], index) => {
    const account = `QA${String(index + 1).padStart(2, "0")}`;
    const credential = presence[account] || {};
    const complete = Boolean(credential.emailPresent && credential.passwordPresent);
    const reserved = index >= 13;
    const avdName = `Envitefy_Fleet_${account}`;
    const port = 5560 + index * 2;
    const profile = {
      account, referenceManufacturer, referenceModel,
      assigned: !reserved && complete,
      credentialStatus: reserved ? "reserved" : complete ? "configured" : credential.emailPresent || credential.passwordPresent ? "incomplete" : "missing",
      avdName, avdHome,
      avdPath: path.join(avdHome, `${avdName}.avd`),
      registryPath: path.join(avdHome, `${avdName}.ini`),
      serial: `emulator-${port}`, port, hardwareProfile, systemImage: SYSTEM_IMAGE,
      provisioned: false,
      provisioning: { status: "not_provisioned" },
    };
    const prior = previous?.profiles?.find((item) => item.account === account);
    if (prior) {
      for (const field of ["avdName", "avdHome", "avdPath", "registryPath", "serial", "port", "hardwareProfile", "systemImage"])
        if (prior[field] !== profile[field])
          throw new Error(`${account}: existing ${field} mapping differs; manifest was not overwritten.`);
      profile.provisioned = prior.provisioned === true;
      profile.provisioning = prior.provisioning || profile.provisioning;
    }
    return profile;
  });
  return {
    schemaVersion: 1, kind: "envitefy-android-qa-fleet",
    createdAt: previous?.createdAt || now, updatedAt: now,
    workspaceRoot: root, sdkRoot: path.resolve(sdkRoot), avdHome, systemImage: SYSTEM_IMAGE,
    credentialSource: ".env.maestro.local (presence only; no credentials stored here)",
    limitations: [
      "Reference phone names are labels for approximate form-factor coverage, not exact OEM hardware, firmware or manufacturer identity.",
      "All profiles use the official stock Android 14 Google Play x86_64 emulator image; no identity spoofing is configured.",
      "Provisioned means the AVD registry and configuration were verified. Boot, Play installation and account sign-in are separate checks.",
      "Automated emulator QA does not establish human participation, Google Play engagement credit or eligibility for production access.",
      "QA14 through QA20 are reserved and remain unassigned even if credentials are later added; revise the authorized plan explicitly first.",
    ],
    profiles,
  };
}

function parseIni(text) {
  return Object.fromEntries(text.split(/\r?\n/).filter((line) => /^\s*[^#;=]+\s*=/.test(line)).map((line) => {
    const split = line.indexOf("=");
    return [line.slice(0, split).trim(), line.slice(split + 1).trim()];
  }));
}

function iniUpdate(text, values) {
  let result = text;
  for (const [key, value] of Object.entries(values)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^${escaped}\\s*=.*$`, "m");
    result = pattern.test(result) ? result.replace(pattern, `${key} = ${value}`) : `${result.trimEnd()}\n${key} = ${value}\n`;
  }
  return result;
}

function normalizedImage(value) {
  return value?.replaceAll("\\", "/").replace(/\/+$/, "");
}

export async function verifyProfileFiles(manifest, profile, { requireTuning = true } = {}) {
  await rejectSymlinks(manifest.workspaceRoot, profile.avdPath);
  await rejectSymlinks(manifest.workspaceRoot, profile.registryPath);
  const registryExists = await exists(profile.registryPath);
  const dataExists = await exists(profile.avdPath);
  if (!registryExists && !dataExists) return { exists: false };
  if (!registryExists || !dataExists)
    throw new Error(`${profile.account}: partial existing AVD registry/data; inspect it before retrying. No files were overwritten.`);
  const registry = parseIni(await readFile(profile.registryPath, "utf8"));
  if (!registry.path || path.resolve(registry.path) !== path.resolve(profile.avdPath) || registry.target !== "android-34")
    throw new Error(`${profile.account}: existing AVD registry path or target differs. No files were overwritten.`);
  const configPath = path.join(profile.avdPath, "config.ini");
  await rejectSymlinks(manifest.workspaceRoot, configPath);
  const text = await readFile(configPath, "utf8");
  const config = parseIni(text);
  if (normalizedImage(config["image.sysdir.1"]) !== "system-images/android-34/google_apis_playstore/x86_64" || config["hw.device.name"] !== profile.hardwareProfile || config["abi.type"] !== "x86_64")
    throw new Error(`${profile.account}: existing AVD system image or hardware profile differs. No files were overwritten.`);
  if (requireTuning && (config["PlayStore.enabled"] !== "yes" || config["hw.ramSize"] !== "3072" || config["hw.cpu.ncore"] !== "2" || config["disk.dataPartition.size"] !== "6G"))
    throw new Error(`${profile.account}: existing AVD resource configuration differs. No files were overwritten.`);
  return { exists: true, configPath, text };
}

export function runBounded(binary, args, { env = process.env, timeoutMs = 120000, input = "", cwd = WORKSPACE } = {}) {
  return new Promise((resolve, reject) => {
    const batch = process.platform === "win32" && /\.(bat|cmd)$/i.test(binary);
    if (batch && [binary, ...args].some((value) => /["\r\n%!&|<>^]/.test(String(value)))) {
      reject(new Error("Unsafe Windows batch argument.")); return;
    }
    const child = spawn(batch ? "cmd.exe" : binary,
      batch ? ["/d", "/s", "/c", `"${[binary, ...args].map((value) => `"${value}"`).join(" ")}"`] : args,
      { env, cwd, windowsHide: true, windowsVerbatimArguments: batch, shell: false, stdio: ["pipe", "pipe", "pipe"] });
    let output = "", timedOut = false, settled = false;
    const finish = (error, exitCode) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      child.stdout.destroy(); child.stderr.destroy();
      if (timedOut) child.unref();
      if (error) reject(error); else resolve({ exitCode, timedOut, output });
    };
    const collect = (data) => { output = (output + data.toString()).slice(-2_000_000); };
    child.stdout.on("data", collect); child.stderr.on("data", collect);
    child.on("error", (error) => finish(error));
    child.on("close", (code) => finish(null, code));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === "win32" && child.pid)
        spawn("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" }).unref();
      else child.kill("SIGTERM");
      setTimeout(() => finish(null, null), 3000).unref();
    }, timeoutMs);
  });
}

export async function provisionProfile(manifest, profile, { commandRunner = runBounded, now = () => new Date().toISOString() } = {}) {
  if (!profile.assigned) throw new Error(`${profile.account}: profile is unassigned; no AVD was created.`);
  const canonical = manifest.profiles.find((item) => item.account === profile.account);
  if (!canonical || JSON.stringify(canonical) !== JSON.stringify(profile))
    throw new Error("Profile must match its manifest entry.");
  const expectedHome = within(manifest.workspaceRoot, path.join(manifest.workspaceRoot, ".tools/android/account-fleet/avd"));
  if (profile.avdHome !== expectedHome || profile.avdPath !== path.join(expectedHome, `${profile.avdName}.avd`) || profile.registryPath !== path.join(expectedHome, `${profile.avdName}.ini`) || !/^Envitefy_Fleet_QA\d{2}$/.test(profile.avdName))
    throw new Error("Profile paths differ from the isolated fleet mapping.");
  if (profile.systemImage !== SYSTEM_IMAGE) throw new Error("Unexpected system image.");
  const installedImage = path.join(manifest.sdkRoot, ...SYSTEM_IMAGE.split(";"), "package.xml");
  await access(installedImage);
  const prior = await verifyProfileFiles(manifest, profile);
  let creation = null;
  if (!prior.exists) {
    await rejectSymlinks(manifest.workspaceRoot, profile.avdHome);
    await mkdir(profile.avdHome, { recursive: true });
    const binary = path.join(manifest.sdkRoot, "cmdline-tools/latest/bin", process.platform === "win32" ? "avdmanager.bat" : "avdmanager");
    await access(binary);
    creation = await commandRunner(binary, ["create", "avd", "--name", profile.avdName, "--package", profile.systemImage, "--device", profile.hardwareProfile, "--path", profile.avdPath], {
      env: { ...process.env, ANDROID_HOME: manifest.sdkRoot, ANDROID_SDK_ROOT: manifest.sdkRoot, ANDROID_AVD_HOME: profile.avdHome },
      cwd: manifest.workspaceRoot, input: "no\n", timeoutMs: 120000,
    });
    if (creation.exitCode !== 0 || creation.timedOut)
      throw new Error(`${profile.account}: avdmanager ${creation.timedOut ? "timed out after 120000ms" : `failed with exit ${creation.exitCode}`}; existing partial files were preserved. ${creation.output.slice(-2000)}`);
    const created = await verifyProfileFiles(manifest, profile, { requireTuning: false });
    if (!created.exists) throw new Error(`${profile.account}: avdmanager returned success without the expected files.`);
    // Only resource settings change. The SDK's manufacturer/model identity stays untouched.
    await writeFile(created.configPath, iniUpdate(created.text, {
      "PlayStore.enabled": "yes", "hw.ramSize": "3072", "hw.cpu.ncore": "2", "disk.dataPartition.size": "6G",
    }));
    await verifyProfileFiles(manifest, profile);
  }
  return {
    ...profile, provisioned: true,
    provisioning: {
      ...profile.provisioning, status: "configuration_verified",
      ...(creation ? { createdAt: now() } : {}), verifiedAt: now(),
      bootVerified: false, installationVerified: false, authenticationVerified: false,
      note: "Configuration verification only. Runtime/authentication results are maintained separately.",
    },
  };
}

export async function saveManifest(manifest) {
  const file = within(manifest.workspaceRoot, path.join(manifest.workspaceRoot, "output/maestro/device-fleet/manifest.json"));
  await rejectSymlinks(manifest.workspaceRoot, file);
  await mkdir(path.dirname(file), { recursive: true });
  const pending = `${file}.pending-${process.pid}`;
  await rejectSymlinks(manifest.workspaceRoot, pending);
  await writeFile(pending, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "w" });
  for (let attempt = 0; ; attempt++) {
    try { await rename(pending, file); break; }
    catch (error) {
      if (!["EPERM", "EACCES", "EBUSY"].includes(error.code) || attempt >= 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
  return file;
}

function summary(manifest) {
  return {
    manifest: path.join(manifest.workspaceRoot, "output/maestro/device-fleet/manifest.json"),
    assigned: manifest.profiles.filter((item) => item.assigned).length,
    reserved: manifest.profiles.filter((item) => item.credentialStatus === "reserved").length,
    configuredAvds: manifest.profiles.filter((item) => item.provisioned).length,
    profiles: manifest.profiles.map(({ account, assigned, credentialStatus, referenceManufacturer, referenceModel, hardwareProfile, serial, provisioned, provisioning }) => ({ account, assigned, credentialStatus, referenceManufacturer, referenceModel, hardwareProfile, serial, provisioned, status: provisioning.status })),
    limitation: "No boot, installation, sign-in, human participation or Google Play engagement is established by provisioning.",
  };
}

export async function main(args = process.argv.slice(2)) {
  const command = args[0] || "status";
  if (!["plan", "provision", "status"].includes(command)) throw new Error("Usage: node scripts/maestro-device-fleet.mjs plan|status|provision [--account QA01|--all]");
  const options = args.slice(1);
  if (command !== "provision" && options.length) throw new Error("Only provision accepts --account or --all.");
  let selected = null;
  if (options.length && !(options.length === 1 && options[0] === "--all")) {
    if (options.length !== 2 || options[0] !== "--account" || !/^QA\d{2}$/.test(options[1])) throw new Error("Use --account QA01 or --all.");
    selected = options[1];
  }
  const file = path.join(WORKSPACE, "output/maestro/device-fleet/manifest.json");
  let previous = null;
  try { previous = JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  if (command === "status") {
    if (!previous) { console.log(JSON.stringify({ status: "not_planned", manifest: file })); return; }
    const observed = [];
    for (const profile of previous.profiles) {
      try { observed.push({ account: profile.account, configurationPresent: (await verifyProfileFiles(previous, profile)).exists }); }
      catch (error) { observed.push({ account: profile.account, configurationPresent: false, error: error.message }); }
    }
    console.log(JSON.stringify({ ...summary(previous), observed }, null, 2)); return;
  }
  let values = {};
  try { values = parseEnv(await readFile(path.join(WORKSPACE, ".env.maestro.local"), "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(process.env.USERPROFILE || "", "AppData/Local/Android/Sdk");
  const manifest = buildManifest({ workspaceRoot: WORKSPACE, sdkRoot, presence: credentialPresence({ ...values, ...process.env }), previous });
  if (selected && !manifest.profiles.some((profile) => profile.account === selected && profile.assigned))
    throw new Error(`${selected}: no assigned configured profile; no AVD was created.`);
  await saveManifest(manifest);
  if (command === "provision") {
    const targets = manifest.profiles.filter((profile) => profile.assigned && (!selected || profile.account === selected));
    let failed = 0;
    for (const profile of targets) {
      try {
        manifest.profiles[manifest.profiles.indexOf(profile)] = await provisionProfile(manifest, profile);
      } catch (error) {
        failed++;
        profile.provisioned = false;
        profile.provisioning = { ...profile.provisioning, status: "configuration_failed", attemptedAt: new Date().toISOString(), error: error.message };
        console.error(error.message);
      }
      manifest.updatedAt = new Date().toISOString(); await saveManifest(manifest);
    }
    if (failed) process.exitCode = 1;
  }
  console.log(JSON.stringify(summary(manifest), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
