const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { createJiti } = require("jiti");

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
  mod.exports = { body: "body", sections: "sections", panel: "panel", index: "index" };
};
const Body = require("./TemplateBodyLayout.tsx").default;
const jiti = createJiti(__filename, { alias: { "@": path.resolve("src") }, fsCache: false });
const { getPublicTemplates } = jiti(path.resolve("src/lib/public-template-catalog.ts"));
const { TEMPLATE_CATEGORIES } = jiti(path.resolve("src/lib/template-categories.ts"));
const { getTemplateBodyPresentation } = jiti(
  path.resolve("src/lib/template-body-presentations.ts"),
);
const profiles = require("../../data/template-body-presentations.json");
const audit = require("../../../docs/design/template-body-audit-2026-09-11.json");
const presentation = { layout: "book", surface: "frame", heading: "number", flow: "memories" };

test("the audit covers every public template and every override has a distinct arrangement and shape in its category", () => {
  assert.deepEqual(new Set(Object.keys(profiles)), new Set(TEMPLATE_CATEGORIES.map((c) => c.slug)));
  for (const { slug } of TEMPLATE_CATEGORIES) {
    const templates = getPublicTemplates(slug);
    const entries = audit.filter((row) => row.category === slug);
    assert.equal(entries.length, templates.length, slug);
    assert.deepEqual(new Set(entries.map((e) => e.id)), new Set(templates.map((t) => t.id)), slug);
    const signatures = new Set();
    for (const row of entries) {
      const profile = getTemplateBodyPresentation(slug, row.id);
      if (row.status === "preserved") {
        assert.equal(profile, undefined, row.id);
        continue;
      }
      assert.ok(profile, row.id);
      assert.deepEqual(profile, {
        layout: row.layout,
        surface: row.surface,
        heading: row.heading,
        flow: row.flow,
      });
      const key = `${profile.layout}/${profile.surface}`;
      assert.ok(!signatures.has(key), `${slug}/${row.id}`);
      signatures.add(key);
    }
    assert.equal(
      Object.keys(profiles[slug]).length,
      entries.filter((e) => e.status === "redesigned").length,
    );
  }
});

test("preserved designs retain their markup and the existing signup spacing wrapper", () => {
  const children = React.createElement(
    React.Fragment,
    null,
    React.createElement("section", { id: "story" }, "A story"),
    false,
    React.createElement(
      React.Fragment,
      null,
      React.createElement("section", { id: "rsvp" }, "Join us"),
    ),
  );
  const original = renderToStaticMarkup(children);
  assert.equal(renderToStaticMarkup(React.createElement(Body, null, children)), original);
  assert.equal(
    renderToStaticMarkup(React.createElement(Body, { fallbackClassName: "space-y-5" }, children)),
    `<div class="space-y-5">${original}</div>`,
  );
});

test("reordered sections keep their content, anchors and action handlers, with no empty panels", () => {
  const action = () => {};
  const rsvp = React.createElement(
    "section",
    { id: "rsvp" },
    React.createElement("button", { onClick: action }, "Respond"),
  );
  const gallery = React.createElement(
    "section",
    { id: "photos" },
    React.createElement("a", { href: "/memory" }, "Memory"),
  );
  const tree = Body({
    presentation,
    sections: [
      { id: "rsvp", content: rsvp },
      { id: "story", content: null },
      { id: "photos", content: gallery },
      { id: "notes", content: false },
    ],
  });
  const panels = tree.props.children.props.children;
  assert.deepEqual(
    panels.map((p) => p.props["data-body-section"]),
    ["photos", "rsvp"],
  );
  assert.equal(panels[0].props.children[1], gallery);
  assert.equal(panels[1].props.children[1].props.children.props.onClick, action);
  assert.equal(Body({ presentation, sections: [{ id: "notes", content: null }] }), null);
  const markup = renderToStaticMarkup(tree);
  assert.ok(markup.includes('id="photos"'));
  assert.ok(markup.includes('id="rsvp"'));
  assert.equal((markup.match(/data-body-section=/g) || []).length, 2);
});
