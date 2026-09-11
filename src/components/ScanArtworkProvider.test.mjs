import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { normalizeScanArtwork } from "../lib/ocr/scan-artwork-state.ts";
import { resolveScanMediaPolicy } from "../lib/ocr/scan-media.ts";

const require = createRequire(import.meta.url);
const module = { exports: {} };
const mocks = {
  "next/navigation": { useRouter: () => ({ refresh() {} }) },
  "@/lib/ocr/scan-artwork-state": { normalizeScanArtwork },
  "./OriginalDocumentCard": {
    __esModule: true,
    default: () => React.createElement("aside", null, "Original document"),
  },
  "./ScanOriginalHero": { ScanOriginalHeroProvider: ({ children }) => children },
};
const { outputText } = ts.transpileModule(
  readFileSync(new URL("./ScanArtworkProvider.tsx", import.meta.url), "utf8"),
  {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  },
);
vm.runInNewContext(outputText, {
  module,
  exports: module.exports,
  require: (name) => mocks[name] || require(name),
});
const Provider = module.exports.default;
const OriginalSection = module.exports.ScanOriginalDocumentSection;

test("owners of designed and unclassified flyers only see background controls in every artwork state", () => {
  for (const scanSourceKind of ["designed", undefined, null, "unknown"]) {
    const policy = resolveScanMediaPolicy(
      {
        createdVia: "ocr",
        category: "Weddings",
        scanSourceKind,
        scanHeroMode: "generated",
      },
      "Avery & Alex Wedding",
    );
    for (const status of [null, "pending", "failed", "ready"]) {
      const initialArtwork = status
        ? {
            version: 1,
            status,
            imageUrl: "/background.webp",
            heroImageUrl: "/old-generated-hero.webp",
          }
        : null;
      const html = renderToStaticMarkup(
        React.createElement(
          Provider,
          {
            eventId: "legacy-wedding",
            policy,
            initialArtwork,
            canManage: true,
            available: true,
            originalInHero: policy.heroMode === "original",
            originalPlacement: "before-footer",
            original: {
              name: "invitation.webp",
              viewUrl: "/original",
              downloadUrl: "/original?download=1",
              ownerOnly: false,
            },
          },
          React.createElement("div", null, "Original invitation"),
          React.createElement(OriginalSection),
        ),
      );
      assert.doesNotMatch(
        html,
        /Use generated artwork|Use original artwork|Generate event artwork|Original document/,
      );
      assert.match(html, /Original invitation/);
      if (!status) assert.match(html, /Generate background/);
      if (status === "pending") assert.match(html, /Creating its background/);
      if (status === "failed") assert.match(html, /Retry background/);
    }
  }
});

test("paperwork retains its original document without offering a hero switch", () => {
  for (const title of ["Business card", "Soccer schedule", "ENT appointment"]) {
    const policy = resolveScanMediaPolicy({ createdVia: "ocr", scanHeroMode: "original" }, title);
    const html = renderToStaticMarkup(React.createElement(Provider, {
      eventId: "paperwork", policy, canManage: true, available: true,
      initialArtwork: { version: 1, status: "ready", imageUrl: "/background.webp", heroImageUrl: "/generated.webp" },
      originalInHero: policy.heroMode === "original", originalPlacement: "before-footer",
      original: { name: "source.webp", viewUrl: "/original", downloadUrl: "/download", ownerOnly: policy.medical },
    }, React.createElement(OriginalSection)));
    assert.match(html, /Original document/);
    assert.doesNotMatch(html, /Use original artwork|Use generated artwork/);
  }
});
