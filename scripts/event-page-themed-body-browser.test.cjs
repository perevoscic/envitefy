const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { chromium } = require("playwright");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const cssLoader = require("./lib/event-editor-css-loader.cjs");

let css = "";
function cssModule(file) {
  const source = cssLoader.call({ resourcePath: file }, fs.readFileSync(file, "utf8"));
  return new Function("document", source.replace("export default", "return"))({
    createElement: () => ({}),
    head: {
      append(style) {
        css += `${style.textContent}\n`;
      },
    },
  });
}
const stubs = {
  "lucide-react": new Proxy({}, { get: () => () => null }),
  "./event-section-builder.module.css": cssModule(
    path.resolve("src/components/events/event-section-builder.module.css"),
  ),
  "./event-page-sections.module.css": cssModule(
    path.resolve("src/components/events/event-page-sections.module.css"),
  ),
  "./template-body-layout.module.css": cssModule(
    path.resolve("src/components/templates/template-body-layout.module.css"),
  ),
};
const cache = new Map(),
  load = (file) => loadTs(file, stubs, cache);
const { EVENT_PAGE_THEMED_DESIGNS } = load("src/data/event-page-themed-designs.ts");
const { getThemedEventBodyPresentation } = load("src/lib/event-page-themed-designs.ts");
const Body = load("src/components/templates/TemplateBodyLayout.tsx").default;
const { EventSectionBuilderProvider } = load("src/components/events/EventSectionBuilder.tsx");
const h = React.createElement;

test("sixty v2 body shapes and headings stay visibly different with only Details, and editing preserves each guest treatment", {
  timeout: 60000,
}, async () => {
  // Every v2 collection uses all sixty directions. The exhaustive static suite
  // covers all 1080 IDs; this browser fixture verifies every direction's real CSS.
  const designs = EVENT_PAGE_THEMED_DESIGNS.filter(
    (design) => design.collection === "bridal-showers",
  );
  assert.equal(designs.length, 60);
  const markup = designs
    .flatMap((design, index) =>
      [false, true].map((editing) => {
        const body = h(Body, {
          presentation: getThemedEventBodyPresentation(design.id),
          sections: [
            {
              id: "details",
              content: h(
                "section",
                null,
                h("h2", null, "Details"),
                h(
                  "p",
                  null,
                  "Useful event information belongs here, with clear arrival instructions for every guest.",
                ),
              ),
            },
          ],
        });
        const tree = editing
          ? h(
              EventSectionBuilderProvider,
              {
                catalog: [],
                onChange() {},
                renderEditor: () => null,
                composition: { onChange() {} },
              },
              body,
            )
          : body;
        const html = renderToStaticMarkup(tree);
        assert.equal(
          html.includes('aria-label="Edit Details"'),
          editing,
          `${design.id}: fixture uses the actual mounted editing canvas`,
        );
        return `<article data-case="${index}" data-editing="${editing}">${html}</article>`;
      }),
    )
    .join("");
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const page = await browser.newPage();
  try {
    await page.setContent(
      `<style>*{box-sizing:border-box}body{margin:0;font-family:Georgia,serif;color:#342d33;background:#faf6ee}article{max-width:1040px;margin:32px auto}h2{margin:0;font-size:24px}p{line-height:1.6}${css}</style>${markup}`,
    );
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const signatures = new Map();
      for (let index = 0; index < designs.length; index++) {
        const shapes = [];
        for (const editing of [false, true]) {
          const article = page.locator(`[data-case="${index}"][data-editing="${editing}"]`);
          const shape = await article.evaluate((element) => {
            const panel = element.querySelector("[data-body-section]"),
              heading = panel.querySelector("h2"),
              number = panel.firstElementChild;
            const properties = [
              "borderTopStyle",
              "borderRightStyle",
              "borderBottomStyle",
              "borderLeftStyle",
              "borderTopWidth",
              "borderRightWidth",
              "borderBottomWidth",
              "borderLeftWidth",
              "borderRadius",
              "paddingTop",
              "paddingRight",
              "paddingBottom",
              "paddingLeft",
            ];
            const selected = (node) => {
              const style = getComputedStyle(node);
              return Object.fromEntries(properties.map((property) => [property, style[property]]));
            };
            const panelStyle = getComputedStyle(panel),
              title = getComputedStyle(heading),
              numeral = getComputedStyle(number);
            // Strip colors from shadows; neither palettes, attributes, IDs nor
            // typefaces may distinguish otherwise identical rendered designs.
            return {
              panel: {
                ...selected(panel),
                shadow: panelStyle.boxShadow.replace(
                  /(?:rgba?|color|oklab|oklch|lab|lch)\([^)]*\)/g,
                  "color",
                ),
              },
              heading: {
                ...selected(heading),
                fontSize: title.fontSize,
                letterSpacing: title.letterSpacing,
                textTransform: title.textTransform,
                lineHeight: title.lineHeight,
              },
              number: {
                display: numeral.display,
                fontSize: numeral.display === "none" ? null : numeral.fontSize,
              },
            };
          });
          assert.ok(
            await article.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
            `${designs[index].id}: ${editing ? "editor" : "guest"} fits ${width}px`,
          );
          const gutters = await article.evaluate((element) => {
            const body = element.querySelector("[data-template-body-layout]").getBoundingClientRect();
            const panel = element.querySelector("[data-body-section]").getBoundingClientRect();
            return { left: panel.left - body.left, right: body.right - panel.right };
          });
          assert.ok(
            gutters.left >= 15.5 && gutters.right >= 15.5,
            `${designs[index].id}: ${editing ? "editor" : "guest"} keeps side gutters at ${width}px: ${JSON.stringify(gutters)}`,
          );
          const textFits = await article.locator("[data-body-section]").evaluate((element) => {
            const panel = element.getBoundingClientRect(),
              text = element.querySelector("h2").getBoundingClientRect();
            return (
              text.x >= panel.x &&
              text.right <= panel.right &&
              text.y >= panel.y &&
              text.bottom <= panel.bottom
            );
          });
          assert.ok(textFits, `${designs[index].id}: heading stays inside its shape at ${width}px`);
          shapes.push(shape);
        }
        for (const [part, properties] of Object.entries(shapes[0])) {
          for (const [property, expected] of Object.entries(properties)) {
            const actual = shapes[1][part][property];
            const message = `${designs[index].id}: editing keeps guest ${part}.${property} at ${width}px`;
            // Editor section handles can reduce the local cqi container by a
            // fraction of a pixel. Keep the same authored padding within 1px.
            if (
              property.startsWith("padding") &&
              typeof expected === "string" &&
              expected.endsWith("px")
            )
              assert.ok(Math.abs(parseFloat(actual) - parseFloat(expected)) <= 1, message);
            else assert.deepEqual(actual, expected, message);
          }
        }
        const signature = JSON.stringify(shapes[0]);
        assert.ok(
          !signatures.has(signature),
          `${designs[index].id} visually duplicates ${signatures.get(signature)} at ${width}px`,
        );
        signatures.set(signature, designs[index].id);
      }
      assert.equal(
        signatures.size,
        60,
        `all sixty body treatments remain visually different with a single Details section at ${width}px`,
      );
    }
    await page.addStyleTag({ content: "article{width:360px}" });
    const narrowFailures = await page.locator("article").evaluateAll((articles) =>
      articles.flatMap((article) => {
        const body = article.querySelector("[data-template-body-layout]").getBoundingClientRect();
        const panel = article.querySelector("[data-body-section]").getBoundingClientRect();
        return panel.left < body.left + 15.5 || panel.right > body.right - 15.5 ||
          article.scrollWidth > article.clientWidth + 1
          ? [{ case: article.dataset.case, editing: article.dataset.editing }]
          : [];
      }),
    );
    assert.deepEqual(narrowFailures, [], "narrow desktop previews retain gutters without overflow");
  } finally {
    await browser.close();
  }
});
