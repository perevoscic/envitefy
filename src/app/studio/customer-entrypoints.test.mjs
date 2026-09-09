import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const readSource = (filename) => readFileSync(path.resolve(filename), "utf8");

function* sourceFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filename = `${directory}/${entry.name}`;
    if (entry.isDirectory()) yield* sourceFiles(filename);
    else if (/\.(?:[cm]?[jt]s|[jt]sx)$/.test(filename) && !/\.test\./.test(filename)) {
      yield filename;
    }
  }
}

function loadModule(source, dependencies = {}) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)((name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}

test("active customer entry points do not send visitors through retired Studio", () => {
  const failures = [];
  for (const filename of sourceFiles("src")) {
    // The old marketing page is unmounted; current cards still use Studio-named render helpers.
    if (filename === "src/app/studio/StudioMarketingPage.tsx") continue;
    const source = readSource(filename);
    assert.doesNotMatch(source, /(?:from\s+|import\s*\(\s*)["'][^"']*\/StudioMarketingPage["']/);
    if (!source.includes("/studio")) continue;
    const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node)) {
        const value = node.text;
        if (/^(?:https?:\/\/(?:www\.)?envitefy\.com)?\/studio(?:[/?#]|$)/i.test(value)) {
          const isAsset = /^\/studio\/.+\.(?:webp|png|jpe?g|svg|avif|gif)(?:[?#].*)?$/i.test(value);
          const isRouteCheck =
            ["src/middleware.ts", "src/components/ConditionalFooter.tsx"].includes(filename) &&
            ["/studio", "/studio/"].includes(value);
          const isOwnerEdit =
            filename === "src/utils/event-edit-route.ts" && value === "/studio?editEvent=";
          if (!isAsset && !isRouteCheck && !isOwnerEdit) failures.push(`${filename}: ${value}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  assert.deepEqual(failures, []);
  assert.doesNotMatch(readSource("src/app/studio/page.tsx"), /StudioMarketingPage|StudioWorkspace/);
});

test("public copy promotes current creation paths without Studio CTAs", () => {
  for (const filename of [
    "public/llms.txt",
    "src/app/layout.tsx",
    "src/app/guides/page.tsx",
    "src/app/guides/guide-content.tsx",
    "src/app/invitation-maker/page.tsx",
    "src/app/faq/page.tsx",
    "src/app/weddings/WeddingsLandingView.tsx",
    "src/app/baby-showers/BabyShowersLandingView.tsx",
    "src/app/bridal-showers/BridalShowersLandingView.tsx",
    "src/app/category-pages/category-page-data.ts",
    "src/components/weddings/WeddingDesignGallery.tsx",
    "src/components/snap-landing/SnapSignupLanding.tsx",
    "src/components/landing/LandingLiveCardShowcase.tsx",
    "src/components/studio/StudioShowcaseLiveCard.tsx",
    "src/lib/guest-chat/knowledge.ts",
    "src/lib/email-templates/magazine-1.ts",
  ]) {
    assert.doesNotMatch(
      readSource(filename),
      /\bEnvitefy Studio\b|\b(?:start|create|design|open|launch|try)\b[^\n"<>]{0,45}\bStudio\b|(?:label|route|routeLabel|productSurface|primaryCta):\s*["']Studio["']|\b(?:bespoke|wedding) studio\b|\bStudio-created\b/i,
      filename,
    );
  }
  assert.match(
    readSource("src/components/snap-landing/SnapSignupLanding.tsx"),
    /label: "Envitefy Concierge", href: "\/envitefy-concierge"/,
  );
  const maker = readSource("src/app/invitation-maker/page.tsx");
  assert.equal([...maker.matchAll(/href="\/chat"/g)].length, 3);
  assert.match(maker, /Create with Concierge/);
  const weddings = readSource("src/app/weddings/WeddingsLandingView.tsx");
  assert.match(weddings, /const studioHref = "\/event\/weddings"/);
  assert.match(weddings, /href=\{studioHref\}[\s\S]*?Customize Your Wedding Invitation/);
});

test("guides direct creation to chat and wedding and birthday design to category templates", () => {
  const filename = "src/app/guides/guide-content.tsx";
  const ast = ts.createSourceFile(filename, readSource(filename), ts.ScriptTarget.Latest, true);
  const declaration = ast.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((item) => item.name.getText(ast) === "guidePages");
  assert.ok(declaration?.initializer);
  const { guidePages } = loadModule(`export const guidePages = ${declaration.initializer.getText(ast)};`);
  for (const [slug, label, href] of [
    ["live-card-invitations", "Create with Concierge", "/chat"],
    ["rsvp-event-page", "Create with Concierge", "/chat"],
    ["registry-invitation-page", "Create with Concierge", "/chat"],
    ["wedding-event-page", "Browse wedding templates", "/weddings#templates"],
    ["birthday-rsvp-invitation", "Browse birthday templates", "/birthdays#templates"],
  ]) {
    assert.deepEqual(guidePages.find((guide) => guide.slug === slug)?.cta, { label, href }, slug);
  }
  const liveCard = guidePages.find((guide) => guide.slug === "live-card-invitations");
  assert.equal(liveCard.productSurface, "Envitefy Concierge");
  assert.equal(liveCard.heroImage, "/images/studio/editor-preview.webp");
  assert.ok(existsSync(`public${liveCard.heroImage}`));
});

test("llms recommendations distinguish product introductions from creation and category pages", () => {
  const llms = readSource("public/llms.txt");
  assert.doesNotMatch(llms, /\/studio\b|\bStudio\b/i);
  for (const [intent, destination] of [
    ["Envitefy Concierge", "/envitefy-concierge"],
    ["live card invitations", "/envitefy-concierge"],
    ["wedding event page", "/weddings"],
    ["birthday invitation with RSVP", "/birthdays"],
  ]) {
    const recommendation = llms.split("\n").find((line) => line.startsWith(`- For "${intent}"`));
    assert.ok(recommendation?.includes(`https://envitefy.com${destination}`), intent);
  }
  assert.match(llms, /To start creating from a message, use https:\/\/envitefy\.com\/chat/);
});

test("owner artwork editing retains its encoded legacy route and Studio asset compatibility", () => {
  const { resolveArtworkEditHref } = loadModule(readSource("src/utils/event-edit-route.ts"), {
    "@/lib/manual-event-progress": {},
    "@/lib/template-categories": {},
    "./event-url": {},
  });
  const artwork = { createdVia: "studio", studioCard: { imageUrl: "/studio/birthday.webp" } };
  assert.equal(resolveArtworkEditHref("saved-event", artwork), "/studio?editEvent=saved-event");
  assert.equal(resolveArtworkEditHref("saved/event?x=1", artwork), "/studio?editEvent=saved%2Fevent%3Fx%3D1");
  assert.equal(resolveArtworkEditHref("no-artwork", { createdVia: "manual" }), null);
  assert.ok(existsSync("public/studio/birthday.webp"));
  assert.match(readSource("src/lib/concierge/history-payload.ts"), /birthday: "\/studio\/birthday\.webp"/);
});
