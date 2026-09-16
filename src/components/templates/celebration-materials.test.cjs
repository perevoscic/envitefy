const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
const resolve = Module._resolveFilename;
const load = Module._load;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(
    this,
    request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request,
    parent,
    ...rest,
  );
};
Module._load = function (request, parent, isMain) {
  if (request === "lucide-react") {
    const file = path.join(process.cwd(), "node_modules/lucide-react/dist/cjs/lucide-react.js");
    const mod = new Module(file, parent);
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(fs.readFileSync(file, "utf8"), file);
    return mod.exports;
  }
  return load.call(this, request, parent, isMain);
};
for (const ext of [".ts", ".tsx"])
  Module._extensions[ext] = (mod, file) =>
    mod._compile(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        fileName: file,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
      file,
    );
Module._extensions[".css"] = (mod) => {
  mod.exports = new Proxy({}, { get: (_, key) => (key === "__esModule" ? false : String(key)) });
};
const React = require("react");
const { renderToStaticMarkup: render } = require("react-dom/server");
const h = React.createElement;
const directions = require("../../data/celebration-art-directions.json");
const { directions: authored } = require("../../../scripts/build-celebration-art-directions.cjs");
const { CELEBRATION_DESIGN_CATALOG } = require("../../data/birthday-design-catalog.ts");
const weddings = require("../../../templates/weddings/index.json");
const babies = require("../../data/baby-shower-templates.json");
const reveals = require("../../data/gender-reveal-templates.json");
const { celebrationMaterialStyle, getCelebrationDirection } = require("./celebration-materials.ts");
const Body = require("./TemplateBodyLayout.tsx").default;
const Wedding = require("../weddings/WeddingRenderer.tsx").default;

test("every live celebration design resolves a valid material and composition", () => {
  const keys = [
    ...CELEBRATION_DESIGN_CATALOG.map(
      (d) => `${d.occasion === "Birthday" ? "birthdays" : "anniversaries"}/${d.id}`,
    ),
    ...weddings.map((d) => `weddings/${d.id}`),
    ...babies.map((d) => `baby-showers/${d.id}`),
    ...reveals.map((d) => `gender-reveal/${d.id}`),
  ];
  assert.equal(keys.length, 330);
  assert.deepEqual(Object.keys(directions).sort(), keys.sort());
  assert.deepEqual(directions, authored, "regenerate the checked-in art directions after edits");
  const treatments = new Set();
  for (const key of keys) {
    const [category, id] = key.split("/");
    const direction = getCelebrationDirection(category, id);
    const style = celebrationMaterialStyle(direction);
    assert.ok(style["--celebration-radius"], key);
    assert.match(style["--celebration-atmosphere"], /gradient\(/, key);
    const geometry = JSON.stringify({
      silhouette: direction.silhouette,
      binding: direction.binding,
      layout: direction.layout,
      heading: direction.heading,
    });
    assert.ok(!treatments.has(geometry), `${key} repeats another complete structural treatment`);
    treatments.add(geometry);
  }
});

test("all 270 shared bodies retain content, anchors and form controls in their selected design", () => {
  for (const [key, direction] of Object.entries(directions)) {
    const [category, id] = key.split("/");
    if (category === "weddings") continue;
    const html = render(
      h(
        Body,
        { design: { category, id } },
        h(
          "section",
          { id: "details" },
          h("h2", null, "Details"),
          h("p", null, "A personal invitation."),
        ),
        false,
        h(
          "section",
          { id: "rsvp" },
          h("label", null, "Your name", h("input", { name: "guestName", required: true })),
          h("button", { type: "submit" }, "Send RSVP"),
        ),
      ),
    );
    assert.ok(html.includes(`data-celebration-design="${key}"`), key);
    assert.ok(html.includes(`data-template-body-layout="${direction.layout}"`), key);
    assert.equal((html.match(/data-body-section=/g) || []).length, 2, key);
    for (const text of [
      'id="details"',
      'id="rsvp"',
      'name="guestName"',
      'required=""',
      'type="submit"',
      "A personal invitation.",
    ])
      assert.ok(html.includes(text), `${key}: ${text}`);
  }
});

test("wedding editor and guest renderer apply each material and preserve the story and main heading", () => {
  for (const design of weddings) {
    const template = require(`../../../templates/weddings/${design.id}/config.json`);
    const html = render(
      h(Wedding, {
        template,
        event: {
          headlineTitle: "Avery & Jordan",
          story: "Our story stays here.",
          customHeroImage: "/uploads/our-wedding.webp",
          schedule: [{ title: "The ceremony", time: "2:00 PM" }],
        },
        hideGuestTools: true,
      }),
    );
    assert.ok(html.includes(`data-celebration-design="weddings/${design.id}"`), design.id);
    assert.ok(html.replace(/<[^>]*>/g, "").includes("Our story stays here."), design.id);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, design.id);
  }
});

test("unrelated categories retain their layout, and no SVG background dependency returns", () => {
  const html = render(
    h(
      Body,
      { design: { category: "signup-forms", id: "custom" } },
      h("section", { id: "rsvp" }, "Reply"),
    ),
  );
  assert.equal(html, '<section id="rsvp">Reply</section>');
  const css = fs.readFileSync(path.join(__dirname, "celebration-materials.module.css"), "utf8");
  assert.doesNotMatch(css, /url\(|\.svg/);
  assert.equal(getCelebrationDirection("birthdays", "missing"), undefined);
});
