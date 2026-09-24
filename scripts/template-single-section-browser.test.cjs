const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { chromium } = require("playwright");
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");
const ts = require("typescript");
const { createJiti } = require("jiti");

// Render the real layouts and styles without sessions, network requests or event writes.
const stylesheets = [];
const cache = new Map();
const mocks = {
  "next/link": ({ children, ...props }) => React.createElement("a", props, children),
  "@/components/smart-signup-form/SignupSharing": () => null,
};
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  if (file.endsWith(".json")) module.exports = JSON.parse(fs.readFileSync(file, "utf8"));
  else if (file.endsWith(".css")) {
    const names = {};
    const prefix = `fixture_${cache.size}_`;
    const css = postcss.parse(fs.readFileSync(file, "utf8"));
    css.walkRules((rule) => {
      rule.selector = rule.selector.replace(/\.([a-zA-Z_][\w-]*)/g, (_, name) => {
        names[name] = prefix + name;
        return `.${prefix}${name}`;
      });
    });
    stylesheets.push(css.toString());
    module.exports = names;
  } else {
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const resolve = (request) => {
      if (request in mocks) return mocks[request];
      if (request === "lucide-react") return new Proxy({}, { get: () => () => null });
      if (request === "./SignupSharing" || request === "./SignupRecovery") return () => null;
      if (!request.startsWith(".") && !request.startsWith("@/")) return require(request);
      const base = request.startsWith("@/")
        ? path.resolve("src", request.slice(2))
        : path.resolve(path.dirname(file), request);
      const target = [base, `${base}.ts`, `${base}.tsx`].find((candidate) =>
        fs.existsSync(candidate),
      );
      assert.ok(target, `Missing fixture dependency: ${request}`);
      return load(target);
    };
    new Function("require", "module", "exports", code)(resolve, module, module.exports);
  }
  return module.exports;
}
const h = React.createElement;
const Body = load("src/components/templates/TemplateBodyLayout.tsx").default;
const Signup = load("src/components/smart-signup-form/SignupViewer.tsx").default;
const jiti = createJiti(__filename, { alias: { "@": path.resolve("src") }, fsCache: false });
const { getPublicTemplates } = jiti(path.resolve("src/lib/public-template-catalog.ts"));
const { TEMPLATE_CATEGORIES } = jiti(path.resolve("src/lib/template-categories.ts"));
const { getTemplateBodyPresentation } = jiti(
  path.resolve("src/lib/template-body-presentations.ts"),
);
const { getCelebrationDirection } = load("src/components/templates/celebration-materials.ts");
const { createSignupTemplateForm } = jiti(path.resolve("src/lib/signup-starters.ts"));

function sharedBody(category, id, count = 1) {
  return h(Body, {
    presentation: getTemplateBodyPresentation(category, id),
    design: { category, id },
    sections: [
      { id: "hidden", content: null },
      ...Array.from({ length: count }, (_, i) => ({
        id: `details-${i}`,
        content: h(
          "section",
          null,
          h("h2", null, "Food"),
          h("p", null, "Please bring enough for the class."),
        ),
      })),
      { id: "removed", content: false },
    ],
  });
}

test("all template bodies and signup designs fill a single section without a reserved column", {
  timeout: 120000,
}, async (t) => {
  const cases = [];
  const layouts = new Set();
  for (const { slug } of TEMPLATE_CATEGORIES) {
    for (const template of getPublicTemplates(slug)) {
      const profile = getTemplateBodyPresentation(slug, template.id);
      const direction = getCelebrationDirection(slug, template.id);
      if (profile || direction) {
        layouts.add(direction?.layout || profile.layout);
        cases.push(
          h(
            "article",
            { key: `${slug}/${template.id}`, "data-case": `${slug}/${template.id}` },
            sharedBody(slug, template.id),
          ),
        );
      }
      if (slug === "signup-forms") {
        const form = createSignupTemplateForm(template);
        form.sections = [
          {
            id: "food",
            title: "Food",
            slots: [{ id: "pumpkin", label: "Pumpkin related food item", capacity: 1 }],
          },
        ];
        cases.push(
          h(
            "article",
            { key: `signup/${template.id}`, "data-case": `signup/${template.id}` },
            h(Signup, { eventId: "preview", viewerKind: "readonly", initialForm: form }),
          ),
        );
      }
    }
  }
  assert.equal(layouts.size, 12, "exercise every body layout, not just Pumpkin Day's columns");
  const css = await postcss([tailwind()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/smart-signup-form/SignupViewer.tsx";',
    { from: path.resolve("scripts/template-single-section-fixture.css") },
  );
  const html = renderToStaticMarkup(h(React.Fragment, null, ...cases));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    const style = `${css.css}\n${stylesheets.join("\n")}\nbody{margin:0}article{max-width:1200px;margin:0 auto}`;
    await page.setContent(`<style>${style}</style>${html}`);
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const failures = await page.locator("[data-case]").evaluateAll((elements) =>
        elements.flatMap((fixture) => {
          const body =
            fixture.querySelector("[data-template-body-layout]") ||
            fixture.querySelector("#signup-input-slots");
          const panel =
            fixture.querySelector("[data-body-section]") ||
            fixture.querySelector("[data-signup-section]");
          if (!body || !panel) return [{ id: fixture.dataset.case, error: "Missing section" }];
          const bounds = body.getBoundingClientRect();
          const section = panel.getBoundingClientRect();
          const styles = getComputedStyle(panel);
          const inset = Math.max(section.left - bounds.left, bounds.right - section.right);
          const overflows = section.left < bounds.left - 1 || section.right > bounds.right + 1;
          // A book's decorative frame is 4px on each side; no layout may reserve a column or percentage inset.
          return inset > 4.5 ||
            overflows ||
            parseFloat(styles.marginLeft) ||
            parseFloat(styles.marginRight)
            ? [
                {
                  id: fixture.dataset.case,
                  body: bounds.width,
                  panel: section.width,
                  inset,
                  overflows,
                },
              ]
            : [];
        }),
      );
      assert.deepEqual(failures, [], `Every single section fills its body at ${width}px`);
    }
    // CSS must respond when the host adds/removes a section without changing the selected design.
    const multi = renderToStaticMarkup(
      sharedBody("signup-forms", "fall-and-seasonal--fall-pumpkins", 2),
    );
    await page.setContent(`<style>${style}</style><article>${multi}</article>`);
    const before = await page.locator("[data-body-section]").first().boundingBox();
    const board = await page.locator("[data-template-body-layout]").boundingBox();
    assert.ok(before.width < board.width * 0.7, "two real sections keep their columns");
    await page
      .locator("[data-body-section]")
      .last()
      .evaluate((element) => element.remove());
    const after = await page.locator("[data-body-section]").boundingBox();
    assert.ok(
      Math.abs(after.width - board.width) < 1,
      "removing the second section immediately expands the remaining section",
    );
    t.diagnostic(
      `Verified ${cases.length} template renderings across ${layouts.size} layouts at phone, tablet and desktop widths.`,
    );
  } finally {
    await browser.close();
  }
});
