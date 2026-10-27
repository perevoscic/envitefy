import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = process.cwd();
const require = createRequire(import.meta.url);
const cache = new Map();

// Render real route components and local previews; account chrome and the async
// catalog have their own integration suites, so stand-ins expose their contracts.
function load(file) {
  const filename = path.resolve(root, file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  if (filename.endsWith(".json")) {
    module.exports = JSON.parse(fs.readFileSync(filename, "utf8"));
    return module.exports;
  }
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const localRequire = (name) => {
    if (name.endsWith(".css"))
      return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name === "next/link")
      return {
        __esModule: true,
        default: ({ children, ...props }) => React.createElement("a", props, children),
      };
    if (name === "next/image")
      return {
        __esModule: true,
        default: ({ fill, priority, unoptimized, ...props }) => React.createElement("img", props),
      };
    if (name === "next/script")
      return {
        __esModule: true,
        default: ({ children, ...props }) => React.createElement("script", props, children),
      };
    if (name === "lucide-react") return new Proxy({}, { get: () => () => null });
    if (name.endsWith("/PublicCreationLink"))
      return {
        __esModule: true,
        default: ({ children, label, signupIntent, ...props }) => {
          const linkProps = { ...props, "data-public-create-destination": props.href };
          return label
            ? React.createElement(load("src/components/ui/ArrowFillLink.tsx").default, {
                ...linkProps,
                label,
              })
            : React.createElement("a", linkProps, children);
        },
      };
    if (name === "@/components/navigation/SignedOutPageChrome")
      return {
        __esModule: true,
        default: () => React.createElement("nav", { "aria-label": "Account navigation" }),
      };
    if (name === "@/components/templates/PublicTemplateGallery")
      return {
        __esModule: true,
        default: ({ category }) =>
          React.createElement("section", { id: "templates", "data-template-category": category }),
      };
    if (name.startsWith("@/") || name.startsWith(".")) {
      const base = name.startsWith("@/")
        ? path.join(root, "src", name.slice(2))
        : path.resolve(path.dirname(filename), name);
      const resolved = [base, `${base}.tsx`, `${base}.ts`].find(
        (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      assert.ok(resolved, `Resolve ${name}`);
      return load(resolved);
    }
    return require(name);
  };
  new Function("require", "module", "exports", outputText)(localRequire, module, module.exports);
  return module.exports;
}

const { getUseCasePageByPath } = load("src/app/category-pages/category-page-data.ts");

for (const [route, componentFile, createHref, previewAnchor] of [
  ["weddings", "src/app/weddings/WeddingsLandingView.tsx", "#templates", "studio"],
  [
    "birthdays",
    "src/app/birthdays/BirthdaysLandingView.tsx",
    "/event/birthdays",
    "birthday-prompt-studio",
  ],
  ["baby-showers", "src/app/baby-showers/BabyShowersLandingView.tsx", "#templates", "registries"],
  [
    "bridal-showers",
    "src/app/bridal-showers/BridalShowersLandingView.tsx",
    "#templates",
    "bridal-studio",
  ],
  ["anniversaries", "src/app/anniversaries/page.tsx", "#templates", "your-celebration"],
  [
    "gender-reveal",
    "src/app/category-pages/CategoryLandingView.tsx",
    "/event/gender-reveal",
    "reveal-start",
  ],
  [
    "signup-forms",
    "src/app/category-pages/CategoryLandingView.tsx",
    "/signup-forms?auth=signup",
    "how-it-works",
  ],
]) {
  test(`${route} keeps a single readable hero, creation destination, gallery and relevant local content`, () => {
    const Component = load(componentFile).default;
    const html = renderToStaticMarkup(
      React.createElement(Component, { page: getUseCasePageByPath(`/${route}`) }),
    );
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /id="landing-hero"/);
    assert.match(html, /aria-label="Sample guest page"/);
    assert.match(html, /data-appearance-scope="authored"/);
    assert.ok(
      html.includes(`href="${createHref}"`),
      "Keep the explicit creation or browsing destination",
    );
    assert.ok(
      html.includes(`id="${previewAnchor}"`),
      "Keep the existing local preview or section anchor",
    );
    assert.ok(
      html.includes(`data-template-category="${route}"`),
      "Keep this route's template gallery",
    );
    assert.doesNotMatch(
      html,
      /Loved by Brides|Loved by brides|Married in Tuscany|Principal Event Designer/,
    );
    for (const [, src] of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
      assert.ok(src.startsWith("/"), `Use original local artwork: ${src}`);
      assert.ok(fs.existsSync(path.join(root, "public", src)), `Artwork exists: ${src}`);
    }
  });
}

test("signup browsing actions open the public gallery without requiring an account", () => {
  const Component = load("src/app/category-pages/CategoryLandingView.tsx").default;
  const html = renderToStaticMarkup(
    React.createElement(Component, { page: getUseCasePageByPath("/signup-forms") }),
  );
  const browseLinks = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].filter((match) => {
    const visibleLabel =
      match[2].match(/data-arrow-fill-label=""[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? match[2];
    return visibleLabel.replace(/<[^>]*>/g, "").trim() === "Browse templates";
  });
  assert.equal(browseLinks.length, 2);
  for (const link of browseLinks) {
    assert.match(link[1], /href="\/signup-forms\/templates"/);
    assert.match(link[1], /data-arrow-fill-button=""/);
    assert.doesNotMatch(link[1], /data-public-create-destination|aria-haspopup="dialog"/);
  }
});

test("all reveal creation actions retain the reveal editor destination", () => {
  const Component = load("src/app/category-pages/CategoryLandingView.tsx").default;
  const html = renderToStaticMarkup(
    React.createElement(Component, { page: getUseCasePageByPath("/gender-reveal") }),
  );
  const createLinks = [...html.matchAll(/<a\b([^>]*data-public-create-destination[^>]*)>/g)];
  assert.equal(createLinks.length, 3);
  for (const link of createLinks) {
    assert.match(link[1], /href="\/event\/gender-reveal"/);
    assert.match(link[1], /data-arrow-fill-button=""/);
  }
});
