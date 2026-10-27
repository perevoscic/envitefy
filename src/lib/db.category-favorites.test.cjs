const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.createSourceFile("db.ts", readFileSync("src/lib/db.ts", "utf8"), ts.ScriptTarget.Latest, true);
const update = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "updateFeatureVisibilityByEmail");
const code = ts.transpileModule(update.getText(source), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

test("pin persistence patches only the authenticated account JSON and preserves absent versus empty pins", async () => {
  const writes = [];
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    ensureUsersHasFeatureVisibilityColumn: async () => {},
    query: async (sql, params) => writes.push({ sql, params: Array.from(params) }),
  });
  const write = module.exports.updateFeatureVisibilityByEmail;
  await write({ email: "Owner@Example.Test", visibleTemplateKeys: ["birthdays"] });
  await write({ email: "Owner@Example.Test", visibleTemplateKeys: ["birthdays"], pinnedCategoryIds: [] });
  await write({ email: "Owner@Example.Test", visibleTemplateKeys: ["birthdays"], pinnedCategoryIds: ["birthdays"] });
  assert.equal(Object.hasOwn(JSON.parse(writes[0].params[1]), "pinnedCategoryIds"), false);
  assert.deepEqual(JSON.parse(writes[1].params[1]).pinnedCategoryIds, []);
  assert.deepEqual(JSON.parse(writes[2].params[1]).pinnedCategoryIds, ["birthdays"]);
  for (const { sql, params } of writes) {
    assert.equal(params[0], "owner@example.test");
    assert.match(sql, /coalesce\(feature_visibility, '\{\}'::jsonb\) \|\| \$2::jsonb/);
    assert.match(sql, /where email = \$1/);
  }
});
