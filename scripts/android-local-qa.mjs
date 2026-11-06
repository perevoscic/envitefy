import path from "node:path";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { ROOT } from "./lib/maestro-core.mjs";
import { acquireAndroidUiLock } from "./lib/maestro-ui-lock.mjs";
import { localQaConfig, checkLocalQaDevice, provisionLocalQaDevice, stopLocalQaDevice } from "./lib/android-local-qa-device.mjs";
import { parseLocalQaArgs, runLocalQa } from "./lib/android-local-qa.mjs";

export async function main(args = process.argv.slice(2)) {
  const options = parseLocalQaArgs(args);
  if (options.help) {
    console.log(`Usage: npm.cmd run android:qa -- doctor|setup|stop
       npm.cmd run android:qa -- run --apk <Envitefy.apk> [--flow <flow.yaml>]
         [--location=-87.6298,41.8781] [--boot-timeout-ms 180000] [--test-timeout-ms 300000]
Uses one dedicated, persistent, headless Windows AVD. APK tests are automated QA only.
setup creates the AVD; run installs without clearing userdata and shuts down normally.
stop recovers an interrupted owned run; it never force-kills another emulator.`);
    return 0;
  }
  const config = localQaConfig();
  if (options.command === "doctor") {
    const report = await checkLocalQaDevice(config); console.log(JSON.stringify(report, null, 2)); return report.ready ? 0 : 1;
  }
  if (options.command === "setup") {
    const release = await acquireAndroidUiLock(config.serial, { kind: "local-android-qa-setup" });
    try { console.log(JSON.stringify(await provisionLocalQaDevice(config), null, 2)); } finally { release(); }
    return 0;
  }
  const artifactDir = path.join(ROOT, "output/maestro/local-qa/runs", `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID().slice(0, 8)}`);
  if (options.command === "stop") {
    const release = await acquireAndroidUiLock(config.serial, { kind: "local-android-qa-stop" });
    try { await mkdir(artifactDir, { recursive: true }); console.log(JSON.stringify(await stopLocalQaDevice(config, { artifactDir }), null, 2)); }
    finally { release(); }
    return 0;
  }
  const report = await runLocalQa(config, options, artifactDir);
  console.log(`Local Android QA: ${report.status}. Report: ${path.join(artifactDir, "report.json")}`);
  for (const check of report.checks.filter(item => item.status !== "passed")) console.log(`${check.name}: ${check.status}. ${check.message}`);
  for (const check of report.diagnostics.filter(item => item.status !== "passed")) console.log(`diagnostic ${check.name}: ${check.message}`);
  return report.status === "passed" ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(code => { process.exitCode = code; }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
