const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const buildBunFixture = require("./build-bun-fixture.cjs");

test("fixture builds use the shell-compatible Bun launcher with bounded execution", () => {
  let actual;
  const expected = Buffer.from("built");
  const result = buildBunFixture("scripts/build-livecard-builder-fixture.mjs", { timeout: 45000 }, (command, options) => {
    actual = { command, options };
    return expected;
  });
  assert.equal(result, expected);
  assert.equal(actual.command, 'bun "scripts/build-livecard-builder-fixture.mjs"');
  assert.deepEqual(actual.options, { timeout: 45000, stdio: "pipe", windowsHide: true });
});

test("fixture entrypoints reject traversal, whitespace and shell syntax before execution", () => {
  for (const script of ["../scripts/build-fixture.mjs", "scripts/build-fixture.mjs & echo unsafe", "scripts/build-a b.mjs", 'scripts/build-a".mjs']) {
    assert.throws(() => buildBunFixture(script, {}, () => assert.fail("must not launch")), /fixed/);
  }
});

test("browser fixtures cannot reintroduce native-only Bun execution", () => {
  const root = path.resolve(__dirname, "..");
  for (const name of fs.readdirSync(root).filter(name => /browser\.test\.[cm]js$/.test(name))) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, name), "utf8"), /(?:execFileSync|spawnSync)\(\s*["']bun["']/,
      `${name} must support Windows Bun shims`);
  }
});
