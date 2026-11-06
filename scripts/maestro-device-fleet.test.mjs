import test from "node:test";
import assert from "node:assert/strict";
import { lstat, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  SYSTEM_IMAGE, buildManifest, credentialPresence, provisionProfile, saveManifest,
} from "./maestro-device-fleet.mjs";

// The Windows restricted temp directory can reject atomic rename despite an
// otherwise valid file write. Exercise the same workspace filesystem used by
// the real manifest, under the repository's ignored output directory.
const TEST_ROOT = path.resolve(import.meta.dirname, "../output/maestro/device-fleet-tests");

function values(count = 13) {
  return Object.fromEntries(Array.from({ length: count }, (_, index) => {
    const account = `QA${String(index + 1).padStart(2, "0")}`;
    return [[`MAESTRO_${account}_EMAIL`, `${account}@private.example.test`], [`MAESTRO_${account}_PASSWORD`, `secret-${account}`]];
  }).flat());
}

async function fixture(t) {
  await mkdir(TEST_ROOT, { recursive: true });
  assert.equal((await lstat(TEST_ROOT)).isSymbolicLink(), false);
  const tempPrefix = path.join(TEST_ROOT, "case-");
  const root = await mkdtemp(tempPrefix);
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), TEST_ROOT);
    assert.match(path.basename(root), /^case-[A-Za-z0-9]{6}$/);
    assert.equal((await lstat(root)).isSymbolicLink(), false);
    await rm(root, { recursive: true, force: true });
  });
  const sdkRoot = path.join(root, "sdk");
  const image = path.join(sdkRoot, ...SYSTEM_IMAGE.split(";"));
  const binaryDir = path.join(sdkRoot, "cmdline-tools/latest/bin");
  await mkdir(image, { recursive: true });
  await mkdir(binaryDir, { recursive: true });
  await writeFile(path.join(image, "package.xml"), "<test-package/>");
  await writeFile(path.join(binaryDir, process.platform === "win32" ? "avdmanager.bat" : "avdmanager"), "test stub");
  const manifest = buildManifest({ workspaceRoot: root, sdkRoot, presence: credentialPresence(values()), now: "2026-10-30T18:00:00Z" });
  return { root, sdkRoot, manifest };
}

async function createMockFiles(profile) {
  await mkdir(profile.avdPath, { recursive: true });
  await writeFile(profile.registryPath, `avd.ini.encoding=UTF-8\npath=${profile.avdPath}\ntarget=android-34\n`);
  await writeFile(path.join(profile.avdPath, "config.ini"), [
    "abi.type=x86_64",
    "image.sysdir.1=system-images\\android-34\\google_apis_playstore\\x86_64\\",
    `hw.device.name=${profile.hardwareProfile}`,
    "hw.device.manufacturer=Google",
    "hw.ramSize=2048", "hw.cpu.ncore=4", "disk.dataPartition.size=2G", "PlayStore.enabled=yes", "",
  ].join("\n"));
}

test("plan has isolated paths and ports, assigns only configured QA01–QA13, and contains no secrets", async (t) => {
  const { root, sdkRoot } = await fixture(t);
  const source = values(20);
  const manifest = buildManifest({ workspaceRoot: root, sdkRoot, presence: credentialPresence(source) });
  assert.equal(manifest.profiles.length, 20);
  assert.equal(manifest.profiles.filter((profile) => profile.assigned).length, 13);
  assert.equal(new Set(manifest.profiles.map((profile) => profile.avdPath)).size, 20);
  assert.equal(new Set(manifest.profiles.map((profile) => profile.serial)).size, 20);
  assert.equal(manifest.profiles[0].port, 5560);
  assert.equal(manifest.profiles[12].port, 5584);
  assert.equal(manifest.profiles[19].port, 5598);
  assert.equal(manifest.profiles[2].hardwareProfile, "pixel_fold");
  assert.equal(manifest.profiles[3].hardwareProfile, "6.7in Foldable");
  assert.ok(manifest.profiles.slice(13).every((profile) => !profile.assigned && profile.credentialStatus === "reserved"));
  for (const secret of Object.values(source)) assert.ok(!JSON.stringify(manifest).includes(secret));
});

test("partial credentials remain unassigned and duplicate identities fail without exposing addresses", () => {
  const source = values(1);
  delete source.MAESTRO_QA01_PASSWORD;
  const manifest = buildManifest({ workspaceRoot: WORKSPACE_FOR_TEST, sdkRoot: path.join(WORKSPACE_FOR_TEST, "sdk"), presence: credentialPresence(source) });
  assert.equal(manifest.profiles[0].assigned, false);
  assert.equal(manifest.profiles[0].credentialStatus, "incomplete");
  assert.equal(manifest.profiles[1].credentialStatus, "missing");
  source.MAESTRO_QA02_EMAIL = source.MAESTRO_QA01_EMAIL.toLowerCase();
  assert.throws(() => credentialPresence(source), (error) => error.message.includes("QA01 and QA02") && !error.message.includes("private.example.test"));
});
const WORKSPACE_FOR_TEST = path.join(TEST_ROOT, "planning-only");

test("provisioning creates a fresh profile once, preserves stock identity, and does not touch auth state", async (t) => {
  const { manifest, root } = await fixture(t);
  const profile = manifest.profiles[0];
  await mkdir(path.join(root, "output/maestro/device-fleet"), { recursive: true });
  const authFile = path.join(root, "output/maestro/device-fleet/state.json");
  const auth = '{"QA01":{"authentication":"owner-managed-existing-state"}}';
  await writeFile(authFile, auth);
  let calls = 0;
  const commandRunner = async (_binary, args, options) => {
    calls++;
    assert.equal(args[0], "create");
    assert.ok(!args.some((arg) => /force|wipe|snapshot/.test(arg)));
    assert.equal(options.env.ANDROID_AVD_HOME, manifest.avdHome);
    assert.equal(options.input, "no\n");
    assert.equal(options.timeoutMs, 120000);
    await createMockFiles(profile);
    return { exitCode: 0, timedOut: false, output: "created" };
  };
  manifest.profiles[0] = await provisionProfile(manifest, profile, { commandRunner });
  const configFile = path.join(profile.avdPath, "config.ini");
  const before = await readFile(configFile, "utf8");
  assert.match(before, /hw\.ramSize = 3072/);
  assert.match(before, /hw\.cpu\.ncore = 2/);
  assert.match(before, /disk\.dataPartition\.size = 6G/);
  assert.match(before, /hw\.device\.manufacturer=Google/);
  assert.ok(!before.includes("Samsung"));
  await provisionProfile(manifest, manifest.profiles[0], { commandRunner });
  assert.equal(calls, 1);
  assert.equal(await readFile(configFile, "utf8"), before);
  assert.equal(await readFile(authFile, "utf8"), auth);
  assert.equal(manifest.profiles[0].provisioned, true);
  assert.equal(manifest.profiles[0].provisioning.bootVerified, false);
  assert.equal(manifest.profiles[0].provisioning.authenticationVerified, false);
});

test("reserved profile cannot be provisioned", async (t) => {
  const { manifest } = await fixture(t);
  await assert.rejects(provisionProfile(manifest, manifest.profiles[13], { commandRunner: () => assert.fail("must not execute") }), /unassigned/);
});

test("an existing registry mapping mismatch fails without overwriting userdata or configuration", async (t) => {
  const { manifest } = await fixture(t);
  const profile = manifest.profiles[0];
  await createMockFiles(profile);
  const wrongRegistry = `path=${path.join(manifest.workspaceRoot, "unrelated-existing-device")}\ntarget=android-34\n`;
  await writeFile(profile.registryPath, wrongRegistry);
  const configFile = path.join(profile.avdPath, "config.ini");
  const original = await readFile(configFile, "utf8");
  await writeFile(path.join(profile.avdPath, "userdata-qemu.img"), "existing-private-data");
  await assert.rejects(provisionProfile(manifest, profile, { commandRunner: () => assert.fail("must not execute") }), /registry path or target differs/);
  assert.equal(await readFile(profile.registryPath, "utf8"), wrongRegistry);
  assert.equal(await readFile(configFile, "utf8"), original);
  assert.equal(await readFile(path.join(profile.avdPath, "userdata-qemu.img"), "utf8"), "existing-private-data");
});

test("partial files and changed resources are not silently overwritten", async (t) => {
  const { manifest } = await fixture(t);
  const profile = manifest.profiles[0];
  await mkdir(profile.avdPath, { recursive: true });
  await assert.rejects(provisionProfile(manifest, profile, { commandRunner: () => assert.fail("must not execute") }), /partial existing/);
  await createMockFiles(profile);
  await assert.rejects(provisionProfile(manifest, profile, { commandRunner: () => assert.fail("must not execute") }), /resource configuration differs/);
});

test("timeout is an explicit failure, never provisioned or booted", async (t) => {
  const { manifest } = await fixture(t);
  await assert.rejects(provisionProfile(manifest, manifest.profiles[0], {
    commandRunner: async () => ({ exitCode: null, timedOut: true, output: "no completion" }),
  }), /timed out after 120000ms/);
  assert.equal(manifest.profiles[0].provisioned, false);
});

test("replanning preserves provision evidence, rejects changed mapping, and writes only its manifest", async (t) => {
  const { manifest, root, sdkRoot } = await fixture(t);
  manifest.profiles[0].provisioned = true;
  manifest.profiles[0].provisioning = { status: "configuration_verified", verifiedAt: "2026-10-30T18:01:00Z" };
  const next = buildManifest({ workspaceRoot: root, sdkRoot, presence: credentialPresence(values()), previous: manifest, now: "2026-10-30T18:02:00Z" });
  assert.deepEqual(next.profiles[0].provisioning, manifest.profiles[0].provisioning);
  assert.equal(next.createdAt, manifest.createdAt);
  assert.equal(next.profiles[0].provisioned, true);
  const saved = await saveManifest(next);
  assert.equal(JSON.parse(await readFile(saved, "utf8")).profiles[0].provisioned, true);
  manifest.profiles[0].port = 9999;
  assert.throws(() => buildManifest({ workspaceRoot: root, sdkRoot, presence: credentialPresence(values()), previous: manifest }), /mapping differs/);
});
