import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { lstat, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { checkLocalQaDevice, localQaConfig, provisionLocalQaDevice, selectLocalQaProcesses, inspectLocalQaProcesses, startLocalQaDevice, stopLocalQaDevice } from "./lib/android-local-qa-device.mjs";

const TEST_ROOT = path.resolve(import.meta.dirname, "../output/maestro/local-qa-device-tests");
const ok = (output = "") => ({ exitCode: 0, timedOut: false, output });
const processInfo = (pid, extra = {}) => ({ pid, parentPid: 1, name: "qemu-system-x86_64.exe", createdAt: "1970-01-01T00:00:00.000Z",
  matchesAvd: false, matchesPath: false, matchesPort: false, ...extra });

async function fixture(t, { provisioned = true } = {}) {
  await mkdir(TEST_ROOT, { recursive: true });
  const root = await mkdtemp(path.join(TEST_ROOT, "case-"));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), TEST_ROOT);
    assert.match(path.basename(root), /^case-[A-Za-z0-9]{6}$/);
    assert.equal((await lstat(root)).isSymbolicLink(), false);
    await rm(root, { recursive: true, force: true });
  });
  const config = localQaConfig({ root, sdkRoot: path.join(root, "sdk") });
  for (const file of [config.adb, config.emulator, config.avdmanager, config.imagePath]) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, "fixture");
  }
  const createFiles = async () => {
    await mkdir(config.avdPath, { recursive: true });
    await writeFile(config.registryPath, `path=${config.avdPath}\ntarget=android-34\n`);
    await writeFile(path.join(config.avdPath, "config.ini"), "abi.type=x86_64\nhw.device.name=pixel_7\nimage.sysdir.1=system-images\\android-34\\google_apis_playstore\\x86_64\\\n");
    return ok("created");
  };
  if (provisioned) await provisionLocalQaDevice(config, { run: createFiles });
  const artifactDir = path.join(config.outputRoot, "runs/fixture");
  return { config, artifactDir, createFiles };
}

function runtime(config, { boot = "1", identity = config.avdName, existing = false, processes = [], otherSerial = "", failedSpawn = false, unlocked = true, packageReady = true } = {}) {
  let time = 0, connected = existing, launched = false;
  const calls = [];
  const run = async (binary, args, options) => {
    calls.push({ binary, args, options });
    if (binary === "powershell.exe") return ok(JSON.stringify([...processes, ...(connected && launched ? [processInfo(12345, { name: "emulator.exe", matchesAvd: true })] : [])]));
    if (args[0] === "devices") return ok(`List of devices attached\n${connected ? `${config.serial}\tdevice product:test` : ""}\n${otherSerial ? `${otherSerial}\tdevice product:other` : ""}\n`);
    if (args.includes("sys.boot_completed")) return ok(boot);
    if (args.includes("name")) return ok(`${identity}\nOK\n`);
    if (args.includes("KEYCODE_WAKEUP") || args.includes("dismiss-keyguard")) return ok();
    if (args.includes("get-started-user-state")) return ok(unlocked ? "RUNNING_UNLOCKED\n" : "RUNNING_LOCKED\n");
    if (args.includes("pm")) return ok(packageReady ? "package:/system/framework/framework-res.apk\n" : "");
    if (args.includes("kill")) { connected = false; return ok("OK"); }
    throw new Error(`Unexpected fixture command ${args.join(" ")}`);
  };
  const spawnProcess = (binary, args, options) => {
    calls.push({ binary, args, options, spawn: true });
    launched = true;
    const child = new EventEmitter();
    child.pid = 12345;
    child.unref = () => {};
    queueMicrotask(() => {
      if (failedSpawn) child.emit("error", new Error("fixture spawn failed"));
      else { connected = true; child.emit("spawn"); }
    });
    return child;
  };
  return { run, spawnProcess, now: () => time, sleep: async (ms) => { time += ms; }, calls, launched: () => launched };
}

test("check is read-only and provisioning is idempotent without data resets", async (t) => {
  const { config, createFiles } = await fixture(t, { provisioned: false });
  const before = await checkLocalQaDevice(config);
  assert.equal(before.ready, false);
  assert.equal(before.imagePresent, true);
  assert.equal(before.provisioned, false);
  await assert.rejects(readFile(config.markerPath), { code: "ENOENT" });
  let count = 0;
  const run = async (binary, args, options) => {
    count++;
    assert.equal(binary, config.avdmanager);
    assert.equal(options.input, "no\n");
    assert.equal(options.env.ANDROID_AVD_HOME, config.avdHome);
    assert.equal(options.timeoutMs, 120000);
    assert.ok(!args.some((item) => /force|wipe|snapshot/.test(item)));
    return createFiles();
  };
  assert.equal((await provisionLocalQaDevice(config, { run })).created, true);
  const userdata = path.join(config.avdPath, "userdata-qemu.img");
  await writeFile(userdata, "retained QA app data");
  const originalConfig = await readFile(path.join(config.avdPath, "config.ini"), "utf8");
  assert.equal((await provisionLocalQaDevice(config, { run })).created, false);
  assert.equal(count, 1);
  assert.equal((await checkLocalQaDevice(config)).ready, true);
  assert.equal(await readFile(userdata, "utf8"), "retained QA app data");
  assert.equal(await readFile(path.join(config.avdPath, "config.ini"), "utf8"), originalConfig);
});

test("unowned or mismatched AVD files are preserved and never adopted", async (t) => {
  const { config, createFiles } = await fixture(t, { provisioned: false });
  await createFiles();
  await assert.rejects(provisionLocalQaDevice(config, { run: () => assert.fail("must not provision") }), /ownership marker/);
  await writeFile(config.registryPath, "path=C:\\unrelated-device\ntarget=android-34\n");
  const report = await checkLocalQaDevice(config);
  assert.equal(report.ready, false);
  assert.match(report.issues.join(" "), /registry path or target differs/);
  await assert.rejects(provisionLocalQaDevice(config, { run: () => assert.fail("must not provision") }), /registry path or target/);
  assert.equal(await readFile(config.registryPath, "utf8"), "path=C:\\unrelated-device\ntarget=android-34\n");
});

test("a provision timeout retains partial data and never writes ownership success", async (t) => {
  const { config, createFiles } = await fixture(t, { provisioned: false });
  await assert.rejects(provisionLocalQaDevice(config, { run: async () => {
    await createFiles();
    return { exitCode: null, timedOut: true, output: "unfinished" };
  } }), /timed out after 120000 ms/);
  await assert.rejects(readFile(config.markerPath), { code: "ENOENT" });
  assert.match(await readFile(config.registryPath, "utf8"), /target=android-34/);
});

test("headless boot and normal stop preserve userdata and release only the verified lease", async (t) => {
  const { config, artifactDir } = await fixture(t);
  const userdata = path.join(config.avdPath, "userdata-qemu.img");
  await writeFile(userdata, "preserved between starts");
  const deps = runtime(config);
  const started = await startLocalQaDevice(config, { artifactDir, ...deps });
  assert.equal(started.status, "android_boot_verified");
  assert.equal(started.startedDevice, true);
  const launch = deps.calls.find((item) => item.spawn);
  assert.ok(["-no-window", "-no-audio", "-no-snapshot", "-no-boot-anim"].every((arg) => launch.args.includes(arg)));
  assert.ok(!launch.args.includes("-wipe-data"));
  assert.equal(launch.options.windowsHide, true);
  assert.equal(launch.options.env.ANDROID_AVD_HOME, config.avdHome);
  assert.equal((await stopLocalQaDevice(config, { artifactDir, ...deps })).status, "stopped_with_userdata_preserved");
  await assert.rejects(readFile(config.leasePath), { code: "ENOENT" });
  assert.equal(await readFile(userdata, "utf8"), "preserved between starts");
  assert.equal(JSON.parse(await readFile(path.join(artifactDir, "device-start.json"), "utf8")).status, "android_boot_verified");
  assert.equal(JSON.parse(await readFile(path.join(artifactDir, "device-stop.json"), "utf8")).status, "stopped_with_userdata_preserved");
});

test("boot timeout retains launch ownership and logs without claiming app verification", async (t) => {
  const { config, artifactDir } = await fixture(t);
  const deps = runtime(config, { boot: "0" });
  await assert.rejects(startLocalQaDevice(config, { artifactDir, bootTimeoutMs: 1000, ...deps }), (error) => {
    assert.equal(error.startedDevice, true);
    assert.equal(error.leasePath, config.leasePath);
    assert.equal(error.classification, "timeout");
    assert.equal(error.timeoutMs, 1000);
    assert.match(error.message, /1000 ms.*installation and app behavior remain unverified/);
    return true;
  });
  const lease = JSON.parse(await readFile(config.leasePath, "utf8"));
  assert.equal(lease.status, "incomplete");
  assert.equal(lease.startedDevice, true);
  assert.equal(await readFile(path.join(artifactDir, "emulator-stdout.log"), "utf8"), "");
  assert.ok(!deps.calls.some((item) => item.args.includes("kill")));
  assert.equal((await stopLocalQaDevice(config, { artifactDir, ...deps })).status, "stopped_with_userdata_preserved");
});

test("identity mismatch refuses shutdown and retains the launch lease", async (t) => {
  const { config, artifactDir } = await fixture(t);
  const deps = runtime(config, { identity: "Unrelated_AVD" });
  await assert.rejects(startLocalQaDevice(config, { artifactDir, ...deps }), /does not match/);
  await assert.rejects(stopLocalQaDevice(config, { artifactDir, ...deps }), /does not match/);
  assert.ok(!deps.calls.some((item) => item.args.includes("kill")));
  assert.ok(!deps.calls.some((item) => item.args.includes("KEYCODE_WAKEUP")));
  assert.equal(JSON.parse(await readFile(config.leasePath, "utf8")).startedDevice, true);
});

test("user unlock and package manager readiness must both pass within the boot budget", async (t) => {
  for (const scenario of [{ unlocked: false }, { packageReady: false }]) {
    const { config, artifactDir } = await fixture(t);
    const deps = runtime(config, scenario);
    await assert.rejects(startLocalQaDevice(config, { artifactDir, bootTimeoutMs: 1000, ...deps }), (error) => error.classification === "timeout" && error.timeoutMs === 1000);
    const state = JSON.parse(await readFile(path.join(artifactDir, "device-start.json"), "utf8"));
    assert.equal(state.bootCompletedObserved, true);
    assert.equal(state.identityVerified, true);
    assert.equal(state.status, "incomplete");
    assert.equal(state.userUnlocked, scenario.unlocked !== false);
    assert.equal(state.packageManagerReady, scenario.packageReady !== false);
    assert.match(state.error, scenario.unlocked === false ? /at user 0 unlock;/ : /at package manager readiness;/);
    const identityAt = deps.calls.findIndex((item) => item.args.includes("name"));
    const wakeAt = deps.calls.findIndex((item) => item.args.includes("KEYCODE_WAKEUP"));
    assert.ok(wakeAt > identityAt);
  }
});

test("ADB inventory timeout names the check and retains its exact timeout", async (t) => {
  const { config, artifactDir } = await fixture(t);
  const deps = runtime(config);
  await assert.rejects(startLocalQaDevice(config, { artifactDir, ...deps, run: async () => ({ exitCode: null, timedOut: true, output: "" }) }), (error) => {
    assert.equal(error.classification, "timeout");
    assert.equal(error.timeoutMs, 10000);
    assert.match(error.message, /ADB device inventory.*10000 ms/);
    return true;
  });
  assert.equal(deps.launched(), false);
});

test("an unresolved local lease prevents launch before any device command", async (t) => {
  const { config, artifactDir } = await fixture(t);
  await mkdir(path.dirname(config.leasePath), { recursive: true });
  await writeFile(config.leasePath, '{"status":"unresolved"}');
  const deps = runtime(config);
  await assert.rejects(startLocalQaDevice(config, { artifactDir, ...deps }), /Unresolved local QA device lease/);
  assert.equal(deps.calls.length, 0);
  assert.equal(await readFile(config.leasePath, "utf8"), '{"status":"unresolved"}');
});

test("own connected serial and orphan local QA processes prevent implicit attachment", async (t) => {
  for (const scenario of [{ existing: true }, { processes: [processInfo(123, { matchesAvd: true })] }, { processes: [processInfo(124, { matchesPort: true })] }]) {
    const { config, artifactDir } = await fixture(t);
    const deps = runtime(config, scenario);
    await assert.rejects(startLocalQaDevice(config, { artifactDir, ...deps }), /already (connected|running)/);
    assert.equal(deps.launched(), false);
    assert.ok(!deps.calls.some((item) => item.args.includes("kill")));
  }
});

test("QA05 lease, serial and process do not block independent local setup, start or verified stop", async (t) => {
  const { config, artifactDir, createFiles } = await fixture(t, { provisioned: false });
  await mkdir(path.dirname(config.fleetLeasePath), { recursive: true });
  const fleetLease = '{"account":"QA05","serial":"emulator-5568","pid":55555}';
  await writeFile(config.fleetLeasePath, fleetLease);
  assert.equal((await provisionLocalQaDevice(config, { run: createFiles })).created, true);
  const deps = runtime(config, { otherSerial: "emulator-5568", processes: [processInfo(55555)] });
  assert.equal((await startLocalQaDevice(config, { artifactDir, ...deps })).status, "android_boot_verified");
  assert.equal((await stopLocalQaDevice(config, { artifactDir, ...deps })).status, "stopped_with_userdata_preserved");
  assert.equal(await readFile(config.fleetLeasePath, "utf8"), fleetLease);
  assert.ok(deps.calls.filter((item) => item.binary === config.adb && item.args[0] === "-s").every((item) => item.args[1] === config.serial));
  await assert.rejects(readFile(config.leasePath), { code: "ENOENT" });
});

test("failed process spawn preserves its unresolved lease and reports no started device", async (t) => {
  const { config, artifactDir } = await fixture(t);
  const deps = runtime(config, { failedSpawn: true });
  await assert.rejects(startLocalQaDevice(config, { artifactDir, ...deps }), (error) => error.startedDevice === false);
  assert.equal(JSON.parse(await readFile(config.leasePath, "utf8")).status, "incomplete");
});

test("unverified process exit leaves the lease and a separate shutdown failure", async (t) => {
  const { config, artifactDir } = await fixture(t);
  const deps = runtime(config);
  await startLocalQaDevice(config, { artifactDir, ...deps });
  const run = async (binary, args, options) => binary === "powershell.exe" ? ok(JSON.stringify([processInfo(12345, { matchesAvd: true })])) : deps.run(binary, args, options);
  await assert.rejects(stopLocalQaDevice(config, { artifactDir, ...deps, run }), /30000 ms.*lease retained/);
  assert.equal(JSON.parse(await readFile(path.join(artifactDir, "device-start.json"), "utf8")).status, "android_boot_verified");
  assert.equal(JSON.parse(await readFile(path.join(artifactDir, "device-stop.json"), "utf8")).status, "incomplete");
  assert.ok(await readFile(config.leasePath, "utf8"));
});

test("process ownership follows descendants and exact creation identity without selecting unrelated devices", () => {
  const root = processInfo(100, { name: "emulator.exe", matchesAvd: true });
  const child = processInfo(101, { parentPid: 100 });
  const grandchild = processInfo(102, { parentPid: 101 });
  const other = processInfo(200);
  const lease = { pid: 100, startedAt: "1970-01-01T00:00:00.000Z", ownedProcesses: [] };
  assert.deepEqual(selectLocalQaProcesses([grandchild, other, child, root], lease).map((item) => item.pid).sort(), [100, 101, 102]);
  const retained = { ...lease, ownedProcesses: [child] };
  assert.deepEqual(selectLocalQaProcesses([other, child], retained).map((item) => item.pid), [101]);
  const reused = processInfo(101, { parentPid: 999, createdAt: "1970-01-02T00:00:00.000Z" });
  assert.deepEqual(selectLocalQaProcesses([reused, other], retained), []);
  const oldChild = processInfo(103, { parentPid: 100, createdAt: "1969-12-31T23:59:50.000Z" });
  assert.deepEqual(selectLocalQaProcesses([oldChild], lease), []);
  const reusedRoot = processInfo(100, { name: "emulator.exe", createdAt: "1970-01-02T00:00:00.000Z" });
  const unrelatedChild = processInfo(300, { parentPid: 100, createdAt: "1970-01-02T00:00:01.000Z" });
  assert.deepEqual(selectLocalQaProcesses([reusedRoot, unrelatedChild], { ...lease, ownedProcesses: [root, child] }), []);
  assert.deepEqual(selectLocalQaProcesses([reusedRoot, unrelatedChild], lease), [], "initial PID fallback is limited to the launch interval");
  assert.deepEqual(selectLocalQaProcesses([unrelatedChild], lease), [], "an absent parent PID alone establishes no ownership");
  const newerParent = processInfo(100, { name: "emulator.exe", createdAt: "1970-01-01T00:00:03.000Z" });
  const olderChild = processInfo(301, { parentPid: 100, createdAt: "1970-01-01T00:00:01.000Z" });
  assert.deepEqual(selectLocalQaProcesses([newerParent, olderChild], lease).map((item) => item.pid), [100], "children cannot predate the selected parent");
});

test("process inventory returns scoped match flags without full process command lines", async (t) => {
  const { config } = await fixture(t);
  const process = processInfo(55555);
  const result = await inspectLocalQaProcesses(config, { run: async (_binary, args) => {
    const script = args.at(-1);
    assert.match(script, /Get-CimInstance/);
    assert.match(script, /matchesAvd/);
    assert.ok(!/CommandLine\s*=|Select-Object[^\n]*CommandLine/.test(script));
    return ok(JSON.stringify(process));
  } });
  assert.deepEqual(result, [process]);
});

test("canonical device mapping and artifact containment cannot target another AVD", async (t) => {
  const { config, artifactDir } = await fixture(t);
  await assert.rejects(startLocalQaDevice({ ...config, serial: "emulator-5560" }, { artifactDir }), /isolated mapping/);
  await assert.rejects(startLocalQaDevice(config, { artifactDir: path.dirname(config.root) }), /inside the workspace/);
  await assert.rejects(stopLocalQaDevice(config, { artifactDir }), /lease is absent or differs/);
});
