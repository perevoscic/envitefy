import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ios = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(ios, file), "utf8");
const app = JSON.parse(await read("app-store/app.json"));
for (const [key, max] of Object.entries({
  name: 30,
  subtitle: 30,
  keywords: 100,
  promotionalText: 170,
  description: 4000,
  whatsNew: 4000,
})) {
  assert.ok(app[key].length > 0 && app[key].length <= max, `${key} exceeds App Store limit ${max}`);
}
assert.match(app.bundleId, /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+){2,}$/);
const project = await read("Envitefy.xcodeproj/project.pbxproj");
assert.ok(project.includes(app.bundleId));
for (const file of await readdir(path.join(ios, "Envitefy"))) {
  if (file.endsWith(".swift"))
    assert.ok(project.includes(file), `${file} missing from Xcode target`);
}
const definitions = [...project.matchAll(/^\s*([A-F0-9]{24}) = \{ isa = /gm)].map(
  (match) => match[1],
);
assert.equal(new Set(definitions).size, definitions.length, "Duplicate PBX object IDs");
for (const reference of project.matchAll(/\b[A-F0-9]{24}\b/g))
  assert.ok(definitions.includes(reference[0]), `Unresolved PBX reference ${reference[0]}`);
const info = await read("Envitefy/Info.plist");
assert.ok(!info.includes("NSAllowsArbitraryLoads"), "ATS must stay enabled");
assert.ok(
  !info.includes("ITSAppUsesNonExemptEncryption"),
  "Export-compliance answer requires completed review",
);
const icon = await sharp(
  path.join(ios, "Envitefy/Assets.xcassets/AppIcon.appiconset/AppIcon.png"),
).metadata();
assert.equal(icon.width, 1024);
assert.equal(icon.height, 1024);
assert.equal(icon.hasAlpha, false);
assert.equal(icon.format, "png");
console.log(
  "PASS: project references, metadata lengths, TLS configuration and 1024px opaque icon. Swift compilation and device behavior require macOS/Xcode.",
);
if (process.argv.includes("--release")) {
  const status = JSON.parse(await read("app-store/release-status.json"));
  const pending = Object.entries(status.checks)
    .filter(([, done]) => done !== true)
    .map(([name]) => name);
  assert.equal(pending.length, 0, `Distribution blocked: ${pending.join(", ")}`);
  assert.match(app.teamId || "", /^[A-Z0-9]{10}$/);
  assert.match(app.appStoreAppleId || "", /^\d+$/);
}
