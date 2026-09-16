const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const postcss = require("postcss");
const { recipes } = require("../../../scripts/build-football-presentations.cjs");

const css = postcss.parse(
  fs.readFileSync(path.join(__dirname, "football-page-content.module.css"), "utf8"),
);
const declarations = new Map();
css.walkRules((rule) =>
  declarations.set(
    rule.selector,
    rule.nodes
      .filter((node) => node.type === "decl")
      .map(({ prop, value }) => `${prop}:${value}`)
      .join(";"),
  ),
);

test("all 90 football designs have individual structural art directions, not palette swaps", () => {
  assert.equal(recipes.length, 90);
  const sectionShapes = new Set();
  const completeTreatments = new Set();
  const componentShapes = { card: new Set(), navigation: new Set(), activeTab: new Set() };
  for (const { id, rules } of recipes) {
    for (const part of ["section", "sectionHeader", "card", "navigation", "activeTab"]) {
      const selector = part === "navigation" ? `.${id}.navigation` : `.${id} .${part}`;
      assert.ok(declarations.has(selector), `${id} has a ${part} treatment`);
    }
    // Deliberately discard palette, background artwork and atmospheric gradients.
    const geometry = rules.section.replace(/background[^;]*;/g, "").replace(/\$[AILWPG]/g, "COLOR");
    assert.ok(!sectionShapes.has(geometry), `${id} repeats another section's geometry`);
    sectionShapes.add(geometry);
    for (const [part, seen] of Object.entries(componentShapes)) {
      const shape = rules[part]
        .replace(/\$[AILWPG]/g, "COLOR")
        .split(";")
        .filter(Boolean)
        .sort()
        .join(";");
      assert.ok(!seen.has(shape), `${id} repeats another design's ${part}`);
      seen.add(shape);
    }
    completeTreatments.add(JSON.stringify(rules).replace(/\$[AILWPG]/g, "COLOR"));
  }
  assert.equal(completeTreatments.size, 90);
});

test("football content keeps gradients without decorative SVG backgrounds", () => {
  assert.doesNotMatch(css.toString(), /--ft-pattern|\.svg/);
  for (const { id } of recipes) {
    assert.match(declarations.get(`.${id}`), /--ft-atmosphere:.*gradient/);
    assert.equal(
      fs.existsSync(path.join(process.cwd(), `public/images/football/patterns/${id}.svg`)),
      false,
    );
  }
});
