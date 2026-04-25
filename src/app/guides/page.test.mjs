import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

const guideRoutes = [
  "/guides/pdf-to-event-page",
  "/guides/flyer-to-event-page",
  "/guides/live-card-invitations",
  "/guides/rsvp-event-page",
  "/guides/gymnastics-meet-page",
  "/guides/share-event-page-without-app",
];

test("AI content hub exposes llms.txt and all guide URLs", () => {
  const llms = readSource("public/llms.txt");

  assert.match(
    llms,
    /Envitefy turns invites, flyers, PDFs, schedules, and studio-created cards into hosted live event pages/,
  );
  assert.match(llms, /https:\/\/envitefy\.com\/snap/);
  assert.match(llms, /https:\/\/envitefy\.com\/gymnastics/);
  assert.match(llms, /https:\/\/envitefy\.com\/studio/);
  assert.match(llms, /https:\/\/envitefy\.com\/showcase/);
  assert.match(llms, /Not only an OCR-to-calendar utility/);

  for (const route of ["/guides", ...guideRoutes]) {
    assert.match(llms, new RegExp(`https://envitefy\\.com${route.replaceAll("/", "\\/")}`));
  }
});

test("sitemap includes the guide hub and guide pages", () => {
  const sitemap = readSource("src/app/sitemap.ts");

  assert.match(sitemap, /path: "\/guides", priority: 0\.8, changeFrequency: "monthly"/);
  for (const route of guideRoutes) {
    assert.match(sitemap, new RegExp(`path: "${route.replaceAll("/", "\\/")}"`));
  }
});

test("key public marketing routes declare canonical metadata", () => {
  const routeFiles = [
    "src/app/snap/page.tsx",
    "src/app/gymnastics/page.tsx",
    "src/app/about/page.tsx",
    "src/app/contact/layout.tsx",
    "src/app/privacy/layout.tsx",
    "src/app/terms/layout.tsx",
    "src/app/event/page.tsx",
  ];

  for (const file of routeFiles) {
    const source = readSource(file);
    assert.match(
      source,
      /alternates:\s*\{\s*canonical:/,
      `${file} should define canonical metadata`,
    );
  }
});

test("guide pages provide crawlable H1s, JSON-LD, and related product links", () => {
  const hub = readSource("src/app/guides/page.tsx");
  const content = readSource("src/app/guides/guide-content.tsx");

  assert.match(hub, /export const metadata/);
  assert.match(hub, /"@type": "CollectionPage"/);
  assert.match(hub, /Guides for live event pages, uploads, RSVPs, and gymnastics meets/);
  assert.match(content, /<h1/);
  assert.match(content, /How do I turn a PDF into an event page\?/);
  assert.match(content, /How do I turn a flyer into an event page\?/);
  assert.match(content, /What are live card invitations\?/);
  assert.match(content, /How do I make an RSVP event page\?/);
  assert.match(content, /How do I create a gymnastics meet page\?/);
  assert.match(content, /Can I share an event page without guests installing an app\?/);
  assert.match(content, /"@type": "WebPage"/);
  assert.match(content, /"@type": "FAQPage"/);
  assert.match(content, /"@type": "BreadcrumbList"/);
  assert.match(content, /href: "\/snap"/);
  assert.match(content, /href: "\/gymnastics"/);
  assert.match(content, /href: "\/studio"/);
  assert.match(content, /href: "\/showcase"/);

  for (const route of guideRoutes) {
    const pagePath = `src/app${route}/page.tsx`;
    const source = readSource(pagePath);
    assert.match(source, /buildGuideMetadata\("/);
    assert.match(source, /<GuidePageView slug="/);
  }
});

test("AI hub routes stay public and are linked from the public footer", () => {
  const middleware = readSource("src/middleware.ts");
  const footer = readSource("src/components/ConditionalFooter.tsx");

  assert.match(middleware, /"\/guides"/);
  assert.match(middleware, /normalized\.startsWith\("\/guides\/"\)/);
  assert.match(middleware, /pathname === "\/llms\.txt"/);
  assert.match(footer, /pathname === "\/guides"/);
  assert.match(footer, /pathname\?\.startsWith\("\/guides\/"\)/);
  assert.match(footer, /href="\/guides"/);
  assert.match(footer, /href="\/guides\/pdf-to-event-page"/);
  assert.match(footer, /href="\/guides\/gymnastics-meet-page"/);
});
