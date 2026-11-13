const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");

// Icons are decorative; keep the real section provider, palette and layout policy.
const icons = new Proxy({}, { get: (_, key) => key === "__esModule" ? true : () => null });
const cache = new Map();
const { EventSectionBuilderProvider, EventSectionPalette } = loadTs(
  "src/components/events/EventSectionBuilder.tsx", { "lucide-react": icons }, cache,
);
const { changeEventSectionLayout } = loadTs("src/lib/event-section-layout.ts", {}, cache);
const entries = [{ id: "meet-details", label: "Meet Details", editorId: "meet" }];
const catalog = [...entries, { id: "documents", label: "Documents & links", editorId: "logistics" }];
const noAction = () => {};
function render(layout) {
  return renderToStaticMarkup(React.createElement(EventSectionBuilderProvider, {
    layout, onChange: noAction, catalog, initialEntries: entries, renderEditor: noAction,
  }, React.createElement(EventSectionPalette)));
}

test("a document section placed beside Meet Details remains editable before its first upload", () => {
  const layout = changeEventSectionLayout(undefined, ["meet-details"], {
    type: "pair", id: "documents", besideId: "meet-details",
  });
  for (const value of [layout, JSON.parse(JSON.stringify(layout))]) {
    const html = render(value);
    assert.ok(html.includes('aria-label="Edit Documents &amp; links"'));
    assert.ok(html.includes('aria-label="Remove Documents &amp; links section"'));
    assert.ok(!html.includes('aria-label="Drag Documents &amp; links onto page"'));
    assert.ok(html.indexOf('aria-label="Edit Meet Details"') < html.indexOf('aria-label="Edit Documents &amp; links"'));
  }
});

test("an empty added document can be removed and restored from Page sections", () => {
  const added = changeEventSectionLayout(undefined, ["meet-details"], {
    type: "add", id: "documents", index: 1,
  });
  const removed = changeEventSectionLayout(added, added.order, { type: "remove", id: "documents" });
  assert.ok(render(removed).includes('aria-label="Drag Documents &amp; links onto page"'));
  assert.ok(!render(removed).includes('aria-label="Remove Documents &amp; links section"'));
  const restored = changeEventSectionLayout(removed, ["meet-details"], { type: "add", id: "documents", index: 1 });
  assert.ok(render(restored).includes('aria-label="Remove Documents &amp; links section"'));
});
