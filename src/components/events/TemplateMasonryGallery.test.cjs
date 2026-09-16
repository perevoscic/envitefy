const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const ts = require("typescript");

function load(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name.endsWith(".css")) return {};
      if (name === "next/link") return "a";
      if (name === "lucide-react") return { Check: () => null };
      if (name.startsWith(".")) {
        return load(path.relative(__dirname, path.resolve(path.dirname(filename), `${name}.ts`)));
      }
      return require(name);
    },
    module,
    module.exports,
  );
  return module.exports;
}

const { TemplateMasonryGrid, TemplateMasonryCard } = load("TemplateMasonryGallery.tsx");
const { FOOTBALL_GALLERY_DESIGNS: designs } = load(
  "../football-season-templates/footballGallery.ts",
);

function slots(items, compact = false) {
  const grid = TemplateMasonryGrid({
    compact,
    children: items.map((design) =>
      React.createElement(TemplateMasonryCard, {
        designId: design.id,
        name: design.name,
        href: `/event/football/customize?templateId=${design.id}`,
        key: design.id,
      }),
    ),
  });
  return React.Children.toArray(grid.props.children);
}

for (const { name, columns, width, inset, gap, compact } of [
  { name: "desktop", columns: 4, width: 1184, inset: 8, gap: 24 },
  { name: "wide desktop", columns: 4, width: 1404, inset: 8, gap: 24 },
  { name: "mobile", columns: 2, width: 350, inset: 6, gap: 16 },
  { name: "tablet", columns: 2, width: 704, inset: 8, gap: 16 },
  { name: "compact picker", columns: 2, width: 300, inset: 4, gap: 12, compact: true },
]) {
  test(`${name} keeps mixed-height football batches balanced without overlaps or missing cards`, () => {
    for (const visibleCount of [12, 24, 36, 48, 60, 72, 84, designs.length]) {
      const items = designs.slice(0, visibleCount);
      const rendered = slots(items, compact);
      assert.deepEqual(
        rendered.map((slot) => slot.props.children.props.designId),
        items.map((d) => d.id),
      );
      const bottoms = Array(columns).fill(0);
      const artworkWidth = (width - (columns - 1) * gap) / columns - 2 * inset - 2;
      let tallestCard = 0;
      for (const slot of rendered) {
        const style = slot.props.style;
        const column = style[`--column-${columns}`] - 1;
        const top =
          style[`--height-${columns}`] * artworkWidth +
          style[`--count-${columns}`] * (2 * inset + 2 + gap);
        const ratio = TemplateMasonryCard(slot.props.children.props).props.style["--tile-ratio"];
        const height = artworkWidth / ratio + 2 * inset + 2;
        assert.ok(Math.abs(top - bottoms[column]) < 0.01, "cards retain their column gap");
        bottoms[column] = top + height + gap;
        tallestCard = Math.max(tallestCard, height);
      }
      const spread = Math.max(...bottoms) - Math.min(...bottoms);
      assert.ok(
        spread <= tallestCard + gap,
        `${visibleCount} designs leave a ${Math.round(spread)}px tail`,
      );
    }
  });
}

test("loading more designs never moves existing cards in either responsive layout", () => {
  const full = slots(designs);
  for (const count of [12, 24, 36, 48, 60, 72, 84]) {
    assert.deepEqual(
      slots(designs.slice(0, count)).map((slot) => slot.props.style),
      full.slice(0, count).map((slot) => slot.props.style),
    );
  }
});

test("filtered results restart at the top and retain catalog order", () => {
  const filtered = designs.filter((design) => design.style.startsWith("Photography"));
  const rendered = slots(filtered);
  assert.deepEqual(
    rendered.map((slot) => slot.props.children.props.designId),
    filtered.map((d) => d.id),
  );
  for (const columns of [2, 4]) {
    for (const slot of rendered.slice(0, columns)) {
      assert.equal(slot.props.style[`--height-${columns}`], 0);
      assert.equal(slot.props.style[`--count-${columns}`], 0);
    }
  }
});
