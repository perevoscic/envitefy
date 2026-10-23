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
const NativeSections = load("src/components/events/EventPageSections.tsx").default;
const CompositionProvider = load(
  "src/components/events/EventPageCompositionContext.tsx",
).EventPageCompositionProvider;
const SectionBuilderProvider = load(
  "src/components/events/EventSectionBuilder.tsx",
).EventSectionBuilderProvider;
const { getCelebrationDirection } = load("src/components/templates/celebration-materials.ts");

test("native Event Page layout choices respect saved section order and narrow containers", {
  timeout: 60000,
}, async () => {
  const layouts = ["split", "banner", "poster", "editorial", "spotlight", "minimal", "cards"];
  const sections = ["schedule", "details", "travel"].map((id) => ({
    id,
    content: h(
      "section",
      { id, style: { padding: "20px" } },
      h("h2", null, id),
      h("p", null, "Useful event information."),
    ),
  }));
  const markup = layouts
    .map(
      (layout) =>
        `<article data-layout-case="${layout}">${renderToStaticMarkup(h(CompositionProvider, { value: { version: 1, layout, sections: [], sectionLayout: { version: 1, order: ["travel", "schedule", "details"], hidden: [], added: [] } } }, h(NativeSections, { sections })))}</article>`,
    )
    .join("");
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const page = await browser.newPage();
  try {
    await page.setContent(
      `<style>${stylesheets.join("\n")}body{margin:0}article{width:100%;margin:20px 0;box-sizing:border-box}section{box-sizing:border-box;min-width:0}</style>${markup}`,
    );
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const layout of layouts) {
        const article = page.locator(`[data-layout-case="${layout}"]`);
        assert.deepEqual(
          await article
            .locator("[data-section-row]")
            .evaluateAll((rows) => rows.map((row) => row.dataset.sectionRow)),
          ["travel", "schedule", "details"],
        );
        assert.ok(
          await article.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
          `${layout} fits at ${width}px`,
        );
        if (["split", "cards"].includes(layout)) {
          const first = await article.locator('[data-section-row="travel"]').boundingBox();
          const second = await article.locator('[data-section-row="schedule"]').boundingBox();
          assert.equal(
            Math.abs(first.y - second.y) < 1,
            width > 700,
            `${layout} columns at ${width}px`,
          );
        }
      }
    }
    await page.addStyleTag({ content: "article{width:500px}" });
    for (const layout of ["split", "cards"]) {
      const article = page.locator(`[data-layout-case="${layout}"]`);
      const first = await article.locator('[data-section-row="travel"]').boundingBox();
      const second = await article.locator('[data-section-row="schedule"]').boundingBox();
      assert.ok(second.y > first.y, `${layout} stacks inside a narrow desktop preview`);
    }
  } finally {
    await browser.close();
  }
});

function sharedBody(category, id, count = 1, presentation) {
  return h(Body, {
    presentation,
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

test("authored body treatments remain visible during section editing and saved composition", {
  timeout: 60000,
}, async () => {
  const arrangements = [
    "editorial",
    "stagger",
    "columns",
    "poster",
    "mosaic",
    "ledger",
    "gallery",
    "path",
    "book",
    "terraces",
    "rail",
    "islands",
  ];
  const sections = ["details", "schedule", "rsvp"].map((id) => ({
    id,
    content: h(
      "section",
      { id },
      h("h2", null, id),
      h("p", null, "Your event information stays in the selected design."),
      id === "rsvp" ? h("button", null, "Respond") : h("a", { href: "/program" }, "Read program"),
    ),
  }));
  const value = {
    version: 1,
    sections: [{ id: "info:arrival", title: "Arrival", body: "Use the south entrance." }],
    sectionLayout: {
      version: 1,
      order: ["info:arrival", "schedule", "details", "rsvp"],
      hidden: ["details"],
      added: ["info:arrival"],
    },
  };
  const cases = arrangements.flatMap((arrangement) =>
    [false, true].map((editing) => {
      const body = h(Body, {
        presentation: {
          layout: arrangement,
          surface: "frame",
          heading: "ribbon",
          flow: "practical",
          borderRadius: "20px",
          spacing: "balanced",
          surfaceTone: "tinted",
        },
        style: { "--body-heading-font": '"Courier New", monospace' },
        sections,
      });
      const runtime = { value, ...(editing ? { onChange: () => {} } : {}) };
      return h(
        "article",
        {
          "data-composed-case": `${arrangement}/${editing ? "editor" : "guest"}`,
          key: `${arrangement}/${editing}`,
        },
        editing
          ? h(
              SectionBuilderProvider,
              {
                composition: runtime,
                layout: value.sectionLayout,
                onChange: () => {},
                catalog: [],
                renderEditor: () => null,
              },
              body,
            )
          : h(CompositionProvider, runtime, body),
      );
    }),
  );
  const materialBody = h(Body, { design: { category: "birthdays", id: "party-pop" }, sections });
  cases.push(
    h(
      "article",
      { "data-composed-case": "material/guest", key: "material" },
      h(CompositionProvider, { value }, materialBody),
    ),
  );
  const html = renderToStaticMarkup(h(React.Fragment, null, ...cases));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<style>${stylesheets.join("\n")}*{box-sizing:border-box}body{margin:0}article{max-width:1200px;margin:0 auto}button,a{font:inherit}h2{font-family:Georgia,serif}</style>${html}`,
    );
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const failures = await page.locator("[data-composed-case]").evaluateAll((fixtures) =>
        fixtures.flatMap((fixture) => {
          const body = fixture.querySelector("[data-template-body-layout]");
          const bodyBox = body.getBoundingClientRect();
          const panels = [...body.querySelectorAll("[data-body-section]")];
          const ids = panels.map((panel) => panel.dataset.bodySection);
          const issue = (message) => ({ id: fixture.dataset.composedCase, message });
          if (ids.join(",") !== "info:arrival,schedule,rsvp")
            return [issue(`Incorrect sections: ${ids}`)];
          for (const panel of panels) {
            const box = panel.getBoundingClientRect();
            const style = getComputedStyle(panel);
            if (
              box.x < bodyBox.x - 1 ||
              box.right > bodyBox.right + 1 ||
              panel.scrollWidth > panel.clientWidth + 1
            )
              return [
                issue(
                  `Section ${panel.dataset.bodySection} overflows: body ${bodyBox.x}/${bodyBox.width}, panel ${box.x}/${box.width}, content ${panel.scrollWidth}/${panel.clientWidth}`,
                ),
              ];
            if (
              !fixture.dataset.composedCase.startsWith("material") &&
              (parseFloat(style.borderTopWidth) < 1 || !style.boxShadow.includes("inset"))
            )
              return [issue("Authored frame is missing")];
            if (
              !fixture.dataset.composedCase.startsWith("material") &&
              (style.borderTopLeftRadius !== "20px" || style.backgroundColor === "rgba(0, 0, 0, 0)")
            )
              return [issue("Authored radius or panel tone is missing")];
            if (
              !fixture.dataset.composedCase.startsWith("material") &&
              !getComputedStyle(panel.querySelector("h2")).fontFamily.includes("Courier New")
            )
              return [issue("Authored body heading font is missing")];
            for (const button of panel.parentElement.querySelectorAll("button")) {
              const buttonBox = button.getBoundingClientRect();
              if (buttonBox.x < bodyBox.x - 1 || buttonBox.right > bodyBox.right + 1)
                return [issue("Section controls overflow")];
            }
          }
          if (
            fixture.dataset.composedCase.startsWith("material") &&
            !getComputedStyle(panels[0]).backgroundImage.includes("gradient")
          )
            return [issue("Authored celebration material is missing")];
          return [];
        }),
      );
      assert.deepEqual(failures, [], `Authored bodies and controls fit at ${width}px`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addStyleTag({ content: "article{max-width:500px}" });
    for (const arrangement of arrangements) {
      const article = page.locator(`[data-composed-case="${arrangement}/editor"]`);
      const first = await article.locator('[data-body-section="info:arrival"]').boundingBox();
      const second = await article.locator('[data-body-section="schedule"]').boundingBox();
      assert.ok(
        second.y > first.y && Math.abs(first.x - second.x) < 1,
        `${arrangement} stacks in the narrow desktop editor`,
      );
    }
  } finally {
    await browser.close();
  }
});

test("all template bodies and signup designs fill a single section within their page gutters", {
  timeout: 120000,
}, async (t) => {
  const Signup = load("src/components/smart-signup-form/SignupViewer.tsx").default;
  const jiti = createJiti(__filename, { alias: { "@": path.resolve("src") }, fsCache: false });
  const { getPublicTemplates } = jiti(path.resolve("src/lib/public-template-catalog.ts"));
  const { TEMPLATE_CATEGORIES } = jiti(path.resolve("src/lib/template-categories.ts"));
  const { getTemplateBodyPresentation } = jiti(
    path.resolve("src/lib/template-body-presentations.ts"),
  );
  const { createSignupTemplateForm } = jiti(path.resolve("src/lib/signup-starters.ts"));
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
            sharedBody(slug, template.id, 1, profile),
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
          const sharedBody = fixture.querySelector("[data-template-body-layout]");
          const body = sharedBody || fixture.querySelector("#signup-input-slots");
          const panel =
            fixture.querySelector("[data-body-section]") ||
            fixture.querySelector("[data-signup-section]");
          if (!body || !panel) return [{ id: fixture.dataset.case, error: "Missing section" }];
          const bounds = body.getBoundingClientRect();
          const bodyStyles = getComputedStyle(body);
          const paddingLeft = sharedBody ? parseFloat(bodyStyles.paddingLeft) : 0;
          const paddingRight = sharedBody ? parseFloat(bodyStyles.paddingRight) : 0;
          const contentLeft = bounds.left + paddingLeft;
          const contentRight = bounds.right - paddingRight;
          const section = panel.getBoundingClientRect();
          const styles = getComputedStyle(panel);
          const inset = Math.max(section.left - contentLeft, contentRight - section.right);
          const overflows = section.left < contentLeft - 1 || section.right > contentRight + 1;
          const missingGutters = sharedBody && (
            paddingLeft < 16 || paddingRight < 16 || Math.abs(paddingLeft - paddingRight) > 1
          );
          // A book's decorative frame is 4px on each side; no layout may reserve a column or percentage inset.
          // Shared bodies retain equal page gutters; signup's own section container keeps its existing bounds.
          return missingGutters ||
            inset > 4.5 ||
            overflows ||
            parseFloat(styles.marginLeft) ||
            parseFloat(styles.marginRight)
            ? [
                {
                  id: fixture.dataset.case,
                  body: bounds.width,
                  content: contentRight - contentLeft,
                  panel: section.width,
                  paddingLeft,
                  paddingRight,
                  missingGutters: Boolean(missingGutters),
                  inset,
                  overflows,
                },
              ]
            : [];
        }),
      );
      assert.deepEqual(failures, [], `Every single section fills its available body at ${width}px`);
    }
    // CSS must respond when the host adds/removes a section without changing the selected design.
    const multi = renderToStaticMarkup(
      sharedBody(
        "signup-forms",
        "fall-and-seasonal--fall-pumpkins",
        2,
        getTemplateBodyPresentation("signup-forms", "fall-and-seasonal--fall-pumpkins"),
      ),
    );
    await page.setContent(`<style>${style}</style><article>${multi}</article>`);
    const before = await page.locator("[data-body-section]").first().boundingBox();
    const contentWidth = await page.locator("[data-template-body-layout]").evaluate((element) => {
      const styles = getComputedStyle(element);
      return element.getBoundingClientRect().width -
        parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    });
    assert.ok(before.width < contentWidth * 0.7, "two real sections keep their columns");
    await page
      .locator("[data-body-section]")
      .last()
      .evaluate((element) => element.remove());
    const after = await page.locator("[data-body-section]").boundingBox();
    assert.ok(
      Math.abs(after.width - contentWidth) < 1,
      "removing the second section immediately fills the body inside its page gutters",
    );
    t.diagnostic(
      `Verified ${cases.length} template renderings across ${layouts.size} layouts at phone, tablet and desktop widths.`,
    );
  } finally {
    await browser.close();
  }
});
