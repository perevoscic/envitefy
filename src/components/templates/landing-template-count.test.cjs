const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");

const { TEMPLATE_CATEGORIES, templateEditorHref } = loadTs("src/lib/template-categories.ts");
const { getPublicTemplates } = loadTs("src/lib/public-template-catalog.ts");
let sessionStatus = "unauthenticated";
const empty = () => null;
const passThrough = ({ children }) => children;
const stubs = {
  "lucide-react": new Proxy({}, { get: () => empty }),
  "next/link": {
    __esModule: true,
    default: ({ children, prefetch: _prefetch, ...props }) =>
      React.createElement("a", props, children),
  },
  "next/image": { __esModule: true, default: empty },
  "next-auth/react": { useSession: () => ({ status: sessionStatus }) },
  "next/dynamic": { __esModule: true, default: () => empty },
  "@/components/events/CategoryGalleryBackdrop": { __esModule: true, default: empty },
  "@/components/events/CreateWithEnvitefyCallout": { __esModule: true, default: empty },
  "@/components/events/EventCustomThemeLauncher": { __esModule: true, default: empty },
  "@/components/events/SeasonalGalleryControls": { __esModule: true, default: empty },
  "./CategoryTemplateThumbnail": {
    __esModule: true,
    default: ({ template }) =>
      React.createElement("div", { "data-template-thumbnail-preview": true }, template.name),
  },
};
const { default: PublicTemplateGalleryContents } = loadTs(
  "src/components/templates/PublicTemplateGalleryContents.tsx",
  stubs,
);

function galleryMarkup(category, featured) {
  return renderToStaticMarkup(
    React.createElement(PublicTemplateGalleryContents, {
      category,
      templates: getPublicTemplates(category),
      featured,
    }),
  );
}

function cardIds(markup) {
  return [...markup.matchAll(/data-template-masonry-card="([^"]+)"/g)].map((match) => match[1]);
}

test("every category landing renders eight distinct selectable templates for guests and accounts", () => {
  for (const status of ["unauthenticated", "authenticated"]) {
    sessionStatus = status;
    for (const { slug } of TEMPLATE_CATEGORIES) {
      const templates = getPublicTemplates(slug);
      const label = `${slug}, ${status}`;
      assert.ok(templates.length >= 8, `${label} has eight available designs`);
      const markup = galleryMarkup(slug, true);
      const ids = cardIds(markup);
      assert.equal(ids.length, 8, label);
      assert.equal(new Set(ids).size, 8, `${label} uses different designs`);
      assert.deepEqual(
        ids,
        templates.slice(0, 8).map(({ id }) => id),
        `${label} preserves catalog order`,
      );
      assert.equal(
        (markup.match(/aria-label="Customize /g) || []).length,
        8,
        `${label} makes every card selectable`,
      );
      for (const template of templates.slice(0, 8)) {
        assert.ok(
          markup.includes(`href="${templateEditorHref(slug, template.id)}"`),
          `${label}, ${template.id} opens its native editor`,
        );
        assert.ok(
          fs.existsSync(path.join("public", template.heroImage)),
          `${label}, ${template.id} has available artwork`,
        );
      }
      assert.ok(markup.includes('data-desktop-columns="4"'), `${label} keeps four desktop columns`);
      assert.ok(markup.includes(`href="/${slug}/templates"`), `${label} retains the full gallery`);
      assert.ok(
        !markup.includes("data-template-autoload"),
        `${label} renders all eight immediately`,
      );
      assert.ok(
        !markup.includes("data-public-gallery-controls"),
        `${label} does not require filtering`,
      );
    }
  }
});

test("full galleries retain their initial twelve cards and access to the complete catalog", () => {
  sessionStatus = "unauthenticated";
  for (const { slug } of TEMPLATE_CATEGORIES) {
    const templates = getPublicTemplates(slug);
    const markup = galleryMarkup(slug, false);
    assert.equal(cardIds(markup).length, 12, slug);
    assert.ok(markup.includes("data-template-autoload"), `${slug} retains incremental loading`);
    assert.ok(
      markup.includes(`Showing 12 of ${templates.length} templates`),
      `${slug} retains the complete catalog`,
    );
    assert.ok(
      markup.includes("data-public-gallery-controls"),
      `${slug} retains search and filters`,
    );
  }
});

test("the football landing renders eight distinct designs with native football editor links", () => {
  sessionStatus = "unauthenticated";
  const { FOOTBALL_GALLERY_DESIGNS } = loadTs(
    "src/components/football-season-templates/footballGallery.ts",
  );
  const { getFootballDesign } = loadTs(
    "src/components/football-season-templates/footballDesigns.ts",
  );
  const { default: FootballLanding } = loadTs(
    "src/components/football-landing/FootballLanding.tsx",
    {
      ...stubs,
      "@/components/auth/AuthModal": { __esModule: true, default: empty },
      "@/components/marketing/MarketingPage": { __esModule: true, default: passThrough },
      "@/components/marketing/MarketingHero": { __esModule: true, default: empty },
      "@/components/navigation/SignedOutPageChrome": { __esModule: true, default: empty },
      "@/components/football-season-templates/FootballThumbnail": {
        __esModule: true,
        default: ({ design }) =>
          React.createElement("div", { "data-template-thumbnail-preview": true }, design.name),
      },
    },
  );
  const markup = renderToStaticMarkup(React.createElement(FootballLanding));
  const ids = cardIds(markup);
  assert.equal(ids.length, 8);
  assert.equal(new Set(ids).size, 8);
  assert.deepEqual(
    ids,
    FOOTBALL_GALLERY_DESIGNS.slice(0, 8).map(({ id }) => id),
  );
  for (const design of FOOTBALL_GALLERY_DESIGNS.slice(0, 8)) {
    assert.ok(
      markup.includes(
        `href="/event/football/customize?templateId=${encodeURIComponent(design.id)}"`,
      ),
    );
    assert.ok(
      fs.existsSync(path.join("public", getFootballDesign(design.id).hero)),
      `${design.id} has available artwork`,
    );
  }
  assert.ok(markup.includes('href="/football/templates"'));
});
