import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import { parseArgs } from "node:util";

// Run only against a disposable emulator, never implicitly against a user's phone.
const { values } = parseArgs({
  options: {
    adb: { type: "string", default: "adb" },
    serial: { type: "string" },
    apk: { type: "string" },
  },
});
assert.match(values.serial ?? "", /^emulator-\d+$/, "Supply --serial emulator-PORT");
assert.ok(values.apk && existsSync(values.apk), "Supply --apk with a built release APK");

const packageName = "com.envitefy.app";
const launcher = `${packageName}/com.google.androidbrowserhelper.trusted.LauncherActivity`;

function adb(...args) {
  const result = spawnSync(values.adb, ["-s", values.serial, ...args], {
    encoding: "utf8",
    timeout: 60_000,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  assert.equal(result.status, 0, `adb ${args[0]} failed: ${output}`);
  return output;
}

assert.equal(adb("shell", "getprop", "sys.boot_completed").trim(), "1", "Boot the emulator first");
assert.match(adb("shell", "dumpsys", "user"), /0=RUNNING_UNLOCKED/, "Wait for emulator user 0 to finish starting");
assert.match(adb("install", "-r", resolve(values.apk)), /Success/);
const installed = adb("shell", "dumpsys", "package", packageName);
console.log(installed.match(/versionName=\S+/)?.[0] ?? "Installed Envitefy");

for (const scenario of ["cold launch", "relaunch", "incoming HTTPS link"]) {
  adb("shell", "am", "force-stop", packageName);
  adb("logcat", "-b", "crash", "-c");
  const intent = scenario === "incoming HTTPS link"
    ? ["-a", "android.intent.action.VIEW", "-d", "https://envitefy.com/", "-n", launcher]
    : ["-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", "-n", launcher];
  const started = adb("shell", "am", "start", "--user", "0", "-W", ...intent);
  assert.doesNotMatch(started, /Error:|Error type|Exception occurred/, `${scenario}: ${started}`);
  await setTimeout(4_000);
  const crashes = adb("logcat", "-d", "-b", "crash", "-v", "brief");
  assert.doesNotMatch(crashes, /com\.envitefy\.app/, `${scenario} crashed:\n${crashes}`);
  assert.doesNotMatch(crashes, /surfaceflinger|system_server/, `Unhealthy emulator:\n${crashes}`);
  const activities = adb("shell", "dumpsys", "activity", "activities");
  const resumed = activities.split("\n").filter(line => /mResumedActivity|topResumedActivity/.test(line)).join("\n");
  assert.match(resumed, /com\.android\.chrome\//, `${scenario} did not reach Chrome:\n${resumed}`);
  console.log(`PASS ${scenario}: no Envitefy crash; Chrome is resumed`);
}

console.log("Launcher smoke passed. Chrome onboarding, website trust and feature parity require separate checks.");
