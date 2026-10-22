const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { createJiti } = require("jiti");

const resolveFilename = Module._resolveFilename;
const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === "lucide-react") return new Proxy({}, { get: () => () => null });
  return originalLoad.call(this, request, ...rest);
};
Module._resolveFilename = function (request, parent, ...rest) {
  return resolveFilename.call(
    this,
    request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request,
    parent,
    ...rest,
  );
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
  mod.exports = { body: "body", sections: "sections", panel: "panel", index: "index" };
};
const Body = require("./TemplateBodyLayout.tsx").default;
const { EventPageCompositionProvider } = require("../events/EventPageCompositionContext.tsx");
const { EventSectionBuilderProvider } = require("../events/EventSectionBuilder.tsx");
const profiles = require("../../data/template-body-presentations.json");
const audit = require("../../../docs/design/template-body-audit-2026-09-11.json");
const presentation = { layout: "book", surface: "frame", heading: "number", flow: "memories" };

test("the dated audit still covers every body override with a distinct arrangement and shape in its category", () => {
  const jiti = createJiti(__filename, { alias: { "@": path.resolve("src") }, fsCache: false });
  const { getPublicTemplate, getPublicTemplates } = jiti(
    path.resolve("src/lib/public-template-catalog.ts"),
  );
  const { getThemedEventBodyPresentation } = jiti(
    path.resolve("src/lib/event-page-themed-designs.ts"),
  );
  const { TEMPLATE_CATEGORIES } = jiti(path.resolve("src/lib/template-categories.ts"));
  const { getTemplateBodyPresentation } = jiti(
    path.resolve("src/lib/template-body-presentations.ts"),
  );
  assert.deepEqual(new Set(Object.keys(profiles)), new Set(TEMPLATE_CATEGORIES.map((c) => c.slug)));
  for (const { slug } of TEMPLATE_CATEGORIES) {
    const templates = getPublicTemplates(slug);
    const entries = audit.filter((row) => row.category === slug);
    for (const entry of entries)
      assert.ok(
        getPublicTemplate(slug, entry.id),
        `${slug}/${entry.id} remains compatible with saved pages`,
      );
    for (const template of templates) {
      if (
        getTemplateBodyPresentation(slug, template.id) &&
        !getThemedEventBodyPresentation(template.id)
      )
        assert.ok(
          entries.some((entry) => entry.id === template.id),
          `${slug}/${template.id} has an audited body override`,
        );
    }
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
  let tree;
  const props = {
    presentation,
    sections: [
      { id: "rsvp", content: rsvp },
      { id: "story", content: null },
      { id: "photos", content: gallery },
      { id: "notes", content: false },
    ],
  };
  function Capture() {
    tree = Body(props);
    return tree;
  }
  renderToStaticMarkup(React.createElement(Capture));
  const panels = tree.props.children.props.children;
  assert.deepEqual(
    panels.map((p) => p.props["data-body-section"]),
    ["photos", "rsvp"],
  );
  assert.equal(panels[0].props.children[1], gallery);
  assert.equal(panels[1].props.children[1].props.children.props.onClick, action);
  function Empty() {
    return Body({ presentation, sections: [{ id: "notes", content: null }] });
  }
  assert.equal(renderToStaticMarkup(React.createElement(Empty)), "");
  const markup = renderToStaticMarkup(tree);
  assert.ok(markup.includes('id="photos"'));
  assert.ok(markup.includes('id="rsvp"'));
  assert.equal((markup.match(/data-body-section=/g) || []).length, 2);
});

test("mounted section editing retains the selected design's body, surfaces and native actions", () => {
  const sections = [
    {
      id: "details",
      content: React.createElement(
        "section",
        { id: "details" },
        React.createElement("h2", null, "Details"),
        React.createElement("a", { href: "/program" }, "Read program"),
      ),
    },
    {
      id: "rsvp",
      content: React.createElement(
        "section",
        { id: "rsvp" },
        React.createElement("h2", null, "RSVP"),
        React.createElement("button", { type: "submit" }, "Send RSVP"),
      ),
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(
      EventSectionBuilderProvider,
      {
        catalog: [],
        onChange: () => {},
        renderEditor: () => null,
        composition: { onChange: () => {} },
      },
      React.createElement(Body, { design: { category: "birthdays", id: "party-pop" }, sections }),
    ),
  );
  assert.match(html, /data-template-body-layout="mosaic"/);
  assert.match(html, /data-celebration-design="birthdays\/party-pop"/);
  assert.match(html, /--celebration-radius:/);
  assert.equal((html.match(/data-body-section=/g) || []).length, 2);
  assert.match(html, /aria-label="Edit Details"/);
  assert.match(html, /aria-label="Remove RSVP section"/);
  assert.match(html, /href="\/program"/);
  assert.match(html, /type="submit">Send RSVP/);
});

test("saved composition retains authored panels for native, paired and added information sections", () => {
  const value = {
    version: 1,
    sections: [{ id: "info:arrival", title: "Arrival", body: "Use the south entrance." }],
    sectionLayout: {
      version: 1,
      order: ["info:arrival", "schedule", "details"],
      hidden: ["details"],
      added: ["info:arrival"],
      pairs: [["info:arrival", "schedule"]],
      widths: { "info:arrival": 4, schedule: 8 },
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(
      EventPageCompositionProvider,
      { value },
      React.createElement(Body, {
        presentation,
        sections: [
          { id: "details", content: React.createElement("section", null, "Hidden event details") },
          {
            id: "schedule",
            content: React.createElement(
              "section",
              null,
              React.createElement("h2", null, "Schedule"),
              "2 PM",
            ),
          },
        ],
      }),
    ),
  );
  assert.match(html, /data-template-body-layout="book"/);
  assert.match(html, /data-body-surface="frame"/);
  assert.match(html, /data-section-row="info:arrival schedule"/);
  assert.match(html, /data-section-width="4"/);
  assert.match(html, /data-section-width="8"/);
  assert.match(html, /data-body-section="info:arrival"/);
  assert.match(html, /data-body-section="schedule"/);
  assert.ok(html.indexOf("Use the south entrance.") < html.indexOf("2 PM"));
  assert.ok(!html.includes("Hidden event details"));
  assert.ok(!html.includes("Edit section"));
});

test("an explicit alternate page layout changes arrangement while retaining authored material and headings", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      EventPageCompositionProvider,
      {
        value: {
          version: 1,
          layout: "cards",
          sections: [
            { id: "info:arrival", title: "Arrival", body: "Read the arrival instructions." },
          ],
        },
      },
      React.createElement(Body, {
        design: { category: "birthdays", id: "party-pop" },
        sections: [
          {
            id: "schedule",
            content: React.createElement(
              "section",
              null,
              React.createElement("h2", null, "Schedule"),
            ),
          },
        ],
      }),
    ),
  );
  assert.match(html, /data-template-body-layout="custom"/);
  assert.match(html, /data-event-body-layout="cards"/);
  assert.match(html, /data-celebration-design="birthdays\/party-pop"/);
  assert.equal((html.match(/data-body-section=/g) || []).length, 2);
});

test("themed body radius, spacing and surface tone survive composition", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      EventPageCompositionProvider,
      {
        value: {
          version: 1,
          sections: [{ id: "info:arrival", title: "Arrival", body: "Park in the south lot." }],
        },
      },
      React.createElement(Body, {
        presentation: {
          ...presentation,
          borderRadius: "18px",
          spacing: "compact",
          surfaceTone: "tinted",
        },
      }),
    ),
  );
  assert.match(html, /data-body-radius="18px"/);
  assert.match(html, /data-body-spacing="compact"/);
  assert.match(html, /data-body-tone="tinted"/);
  assert.match(html, /--body-panel-radius:18px/);
  assert.match(html, /--body-panel-padding:clamp\(1rem, 2cqi, 1\.5rem\)/);
  assert.match(html, /--body-tint:color-mix\(in srgb, currentColor 10%, transparent\)/);
});
