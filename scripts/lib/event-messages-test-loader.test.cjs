const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const loadTs = require("./event-messages-test-loader.cjs");

function fixture(t, files) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "envitefy-test-loader-"));
  t.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith("envitefy-test-loader-"));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  for (const [name, source] of Object.entries(files)) fs.writeFileSync(path.join(directory, name), source);
  return name => path.join(directory, name);
}

test("TypeScript JSON imports retain objects, arrays and values through relative and aliased imports", t => {
  const data = { designs: [{ id: "saved-design", ready: true }], readyDesignIds: ["saved-design"], count: 1, empty: null };
  const file = fixture(t, {
    "catalog.json": JSON.stringify(data),
    "ids.json": '["saved-design", "another-design"]',
    "entry.ts": `import catalog from "./catalog.json";
      import ids from "./ids.json";
      import legacy from "@/data/event-page-themed-legacy.json";
      export { catalog, ids, legacy };`,
  });
  const cache = new Map();
  const result = loadTs(file("entry.ts"), {}, cache);
  assert.deepEqual(result.catalog, data);
  assert.deepEqual(result.ids, ["saved-design", "another-design"]);
  assert.equal(result.catalog, loadTs(file("catalog.json"), {}, cache), "one graph retains the same JSON object");
  assert.deepEqual(result.legacy, JSON.parse(fs.readFileSync("src/data/event-page-themed-legacy.json", "utf8")));
});

test("the actual themed design graph preserves frozen legacy metadata and availability", () => {
  const legacy = JSON.parse(fs.readFileSync("src/data/event-page-themed-legacy.json", "utf8"));
  const designs = loadTs("src/lib/event-page-themed-designs.ts");
  assert.ok(legacy.designs.length > 0);
  for (const design of legacy.designs) {
    assert.deepEqual(designs.getThemedEventDesign(design.id), design);
    assert.equal(designs.isThemedEventArtworkAvailable(design.id), legacy.readyDesignIds.includes(design.id));
  }
});

test("shared loading supports TSX/CSS, CommonJS exports and dependency stubs without global hooks", t => {
  const file = fixture(t, {
    "tokens.module.css": ".heading { color: plum; }",
    "value.ts": "module.exports = { title: 'saved title' };",
    "entry.tsx": `import styles from "./tokens.module.css";
      import value from "./value";
      import { decorate } from "test-dependency";
      export const heading = <h1 className={styles.heading}>{decorate(value.title)}</h1>;`,
  });
  const hooks = { ...require.extensions };
  const React = require("react");
  const jsxRuntime = require("react/jsx-runtime");
  const { heading } = loadTs(file("entry.tsx"), { "react/jsx-runtime": jsxRuntime, "test-dependency": { decorate: value => value.toUpperCase() } });
  assert.ok(React.isValidElement(heading));
  assert.equal(heading.type, "h1");
  assert.deepEqual(heading.props, { className: "heading", children: "SAVED TITLE" });
  assert.deepEqual({ ...require.extensions }, hooks);
});

test("explicit .mjs dependencies compile to executable CommonJS alongside TypeScript", t => {
  const file = fixture(t, {
    "words.mjs": 'export const title = "saved title";',
    "value.mjs": 'import { title } from "./words.mjs"; export const upper = () => title.toUpperCase(); export default { title };',
    "entry.ts": 'import value, { upper } from "./value.mjs"; export const result = [value.title, upper()];',
  });
  assert.deepEqual(loadTs(file("entry.ts")).result, ["saved title", "SAVED TITLE"]);
  assert.equal(loadTs(file("value.mjs")).upper(), "SAVED TITLE");
});

test("a failed JSON dependency cannot leave a successful empty module cached", t => {
  const file = fixture(t, {
    "catalog.json": '{"designs":',
    "entry.ts": 'import catalog from "./catalog.json"; export const count = catalog.designs.length;',
  });
  const cache = new Map();
  assert.throws(() => loadTs(file("entry.ts"), {}, cache), SyntaxError);
  fs.writeFileSync(file("catalog.json"), '{"designs":[{"id":"recovered"}]}');
  assert.equal(loadTs(file("entry.ts"), {}, cache).count, 1);
});
