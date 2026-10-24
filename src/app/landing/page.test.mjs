import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const repoRoot = process.cwd();
const require = createRequire(import.meta.url);
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

// Render actual homepage content. Framework routing, decorative icons, prepared
// image delivery and deferred dialogs are replaced; content and category data remain.
function loadLandingComponent(relativePath, cache = new Map()) {
  const filename = path.resolve(repoRoot, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const componentModule = { exports: {} };
  cache.set(filename, componentModule);
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
        default: ({ fill, priority, unoptimized, sizes, ...props }) =>
          React.createElement("img", props),
      };
    if (name === "next/dynamic") return { __esModule: true, default: () => () => null };
    if (name === "next/navigation")
      return {
        useRouter: () => ({
          push() {
            throw new Error("Homepage rendering must not navigate");
          },
        }),
        usePathname: () => "/",
      };
    if (name === "next-auth/react")
      return { useSession: () => ({ status: "unauthenticated", data: null }) };
    if (name === "lucide-react") return new Proxy({}, { get: () => () => null });
    if (name.startsWith("@/") || name.startsWith(".")) {
      const base = name.startsWith("@/")
        ? path.join(repoRoot, "src", name.slice(2))
        : path.resolve(path.dirname(filename), name);
      const resolved = [
        base,
        `${base}.tsx`,
        `${base}.ts`,
        `${base}.mjs`,
        path.join(base, "index.tsx"),
      ].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      assert.ok(resolved, `Unable to resolve homepage dependency ${name}`);
      if (resolved.endsWith(".json")) return JSON.parse(fs.readFileSync(resolved, "utf8"));
      return loadLandingComponent(path.relative(repoRoot, resolved), cache);
    }
    return require(name);
  };
  new Function("require", "module", "exports", outputText)(
    localRequire,
    componentModule,
    componentModule.exports,
  );
  return componentModule.exports;
}

function renderLanding() {
  const LandingExperience = loadLandingComponent("src/app/landing/LandingExperience.tsx").default;
  return renderToStaticMarkup(React.createElement(LandingExperience));
}

test("homepage first explains the product, then the steps, designs and guest benefits", () => {
  const html = renderLanding();
  assert.equal((html.match(/<h1\b/g) || []).length, 1, "One main product heading is rendered");
  assert.match(html, /Beautiful invites\./);
  assert.match(html, /All the details\./);
  assert.match(html, /One link\./);
  assert.match(html, /Create your event/);
  assert.match(html, /No app needed for guests/);
  assert.match(html, /aria-label="Main navigation"/);
  assert.match(html, /href="#landing-content"[^>]*>Skip to content/);
  assert.match(html, /<main id="landing-content"/);
  const anchors = [
    "landing-hero",
    "how-it-works",
    "examples",
    "guest-flow",
    "showcase",
    "creation-paths",
  ];
  let previousPosition = -1;
  for (const id of anchors) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > previousPosition, `${id} follows the preceding section`);
    previousPosition = position;
  }
  assert.match(html, /Start your way/);
  assert.match(html, /Make it yours/);
  assert.match(html, /Share one link/);
  assert.match(html, /<ol\b/);
  assert.match(html, /href="#showcase"/);
  assert.equal(
    (html.match(/<details\b/g) || []).length,
    4,
    "Practical questions are available without opening a dialog",
  );
  assert.doesNotMatch(html, /FAQPage|Ask Concierge<\/h1/);
});

test("the rendered design directory keeps all eight public category destinations and real artwork", () => {
  const html = renderLanding();
  assert.equal((html.match(/data-category=/g) || []).length, 8);
  for (const [id, href, label] of [
    ["weddings", "/weddings", "Weddings"],
    ["birthdays", "/birthdays", "Birthdays"],
    ["baby-showers", "/baby-showers", "Baby Showers"],
    ["bridal-showers", "/bridal-showers", "Bridal Showers"],
    ["gender-reveal", "/gender-reveal", "Gender Reveals"],
    ["signup-forms", "/signup-forms", "Signup Forms"],
    ["sports", "/sport-events", "Sports"],
    ["gymnastics", "/gymnastics", "Gymnastics"],
  ]) {
    assert.ok(html.includes(`href="${href}"`), `${label} links to its public category`);
    assert.ok(html.includes(`data-category="${id}"`), `${label} remains in the directory`);
    assert.ok(html.includes(`<h3>${label}</h3>`));
  }
  for (const [, asset] of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
    assert.ok(asset.startsWith("/"), `Homepage artwork uses local assets: ${asset}`);
    assert.ok(fs.existsSync(path.join(repoRoot, "public", asset.slice(1))), `${asset} exists`);
  }
});

test("explicit creation continues to Create after authentication while ordinary login returns home", () => {
  const landing = readSource("src/app/landing/LandingExperience.tsx");
  const html = renderLanding();
  assert.match(landing, /\[authRedirect, setAuthRedirect\] = useState\("\/"\)/);
  assert.match(landing, /openAuth\("login"\)/);
  assert.match(landing, /openAuth\("signup", "\/create"\)/);
  assert.match(landing, /status === "authenticated"[\s\S]*?router\.push\("\/create"\)/);
  assert.match(landing, /successRedirectUrl=\{authRedirect\}/);
  assert.match(landing, /<ProductLandingHero onCreate=\{onCreateEvent\}/);
  assert.match(
    landing,
    /<MenuBottomSheet[^>]*successRedirectUrl="\/"[^>]*signupSuccessRedirectUrl="\/"/,
  );
  assert.match(landing, /<ConciergeSheet[^>]*onSignupSelect=\{\(\) => openAuth\("signup"\)\}/);
  assert.doesNotMatch(html, /href="\/create"|href="\/?\?auth=signup"/);
});

test("the guest preview is clearly a sample and never sends responses or saves an event", () => {
  const hero = readSource("src/app/landing/sections/ProductLandingHero.tsx");
  const landing = readSource("src/app/landing/LandingExperience.tsx");
  const html = renderLanding();
  assert.match(html, /An example of an Envitefy guest event page/);
  assert.match(html, /RSVP to the brunch/);
  assert.match(html, /Directions/);
  assert.match(html, /Add to calendar/);
  assert.match(html, /Sample host response view/);
  assert.match(html, /aria-controls="landing-sample-action"/);
  assert.match(html, /id="landing-sample-action"[^>]*hidden=""/);
  assert.match(hero, /setReply\(option\)/);
  assert.match(hero, /Nothing has been sent\./);
  assert.match(hero, /this is just a sample/);
  assert.doesNotMatch(
    hero,
    /\bfetch\s*\(|\/api\/|localStorage|sessionStorage|navigator\.share|window\.open/,
  );
  assert.doesNotMatch(
    landing,
    /\bfetch\s*\(|\/api\/(?:events|rsvp|discovery)|createEvent\(|saveDraft\(/,
  );
});

test("homepage retains canonical invitation metadata and public root routing", () => {
  const page = readSource("src/app/landing/page.tsx");
  const middleware = readSource("src/middleware.ts");
  assert.match(page, /<LandingExperience\s*\/>/);
  assert.match(page, /Online Invitation Maker with RSVP & Event Pages/);
  assert.match(page, /Create an online invitation and hosted event page/);
  assert.match(page, /canonical:\s*"\/"/);
  assert.match(page, /"@type":\s*"WebPage"/);
  assert.doesNotMatch(page, /FAQPage/);
  assert.match(middleware, /url\.pathname = "\/landing"/);
  assert.match(middleware, /NextResponse\.rewrite\(url\)/);
});

test("landing preserves canonical wordmark, prepared assets and public font delivery", () => {
  const landing = readSource("src/app/landing/LandingExperience.tsx");
  const wordmark = readSource("src/components/branding/EnvitefyWordmark.tsx");
  const brandImage = readSource("src/components/branding/EnvitefyBrandImage.tsx");
  const assets = readSource("src/lib/brand-assets.ts");
  const globals = readSource("src/app/globals.css");
  const middleware = readSource("src/middleware.ts");
  assert.match(landing, /EnvitefyBrandImage/);
  assert.match(landing, /ENVITEFY_BRAND_ASSETS\.wordmark\.color/);
  assert.match(landing, /ENVITEFY_BRAND_ASSETS\.wordmark\.white/);
  assert.match(brandImage, /unoptimized = true/);
  assert.match(wordmark, /scale-\[2\.95\]/);
  assert.match(wordmark, /var\(--font-josefin-slab\)/);
  assert.match(wordmark, /"Josefin Slab"/);
  assert.match(wordmark, /fontWeight: 700/);
  assert.match(wordmark, /fontOpticalSizing: "auto"/);
  assert.match(wordmark, /letterSpacing: "-0\.075em"/);
  assert.match(wordmark, /marginLeft: "0\.005em"/);
  assert.match(wordmark, /env<span[\s\S]*>itef<\/span><span>y<\/span>/);
  assert.match(
    wordmark,
    /leading-\[1\.16\] pl-\[0\.02em\] pr-\[0\.14em\] pt-\[0\.04em\] pb-\[0\.16em\]/,
  );
  assert.match(
    wordmark,
    /linear-gradient\(96deg, #6b3cff 0%, #6757ff 22%, #5a7dff 54%, #37a8ff 100%\)/,
  );
  assert.match(wordmark, /color: "#ffffff"/);
  assert.doesNotMatch(wordmark, /josefin-sans-variable|"Josefin Sans"/);
  assert.match(globals, /font-family:\s*"Josefin Slab"/);
  assert.match(middleware, /pathname\.startsWith\("\/fonts\/"\)/);
  assert.match(middleware, /woff\|woff2\|ttf\|otf/);
  for (const asset of [
    "/brand/wordmark-v2/envitefy-wordmark.webp",
    "/brand/wordmark-v2/envitefy-wordmark-white.webp",
  ]) {
    assert.ok(assets.includes(asset));
    assert.ok(fs.existsSync(path.join(repoRoot, "public", asset.slice(1))), `${asset} exists`);
  }
  assert.ok(
    fs.existsSync(
      path.join(repoRoot, "public/fonts/Josefin_Slab/JosefinSlab-VariableFont_wght.ttf"),
    ),
  );
});

test("shared signed-out navigation keeps categories and inert hidden controls", () => {
  const navigation = readSource("src/config/navigation.ts");
  const scrollNavigation = readSource("src/components/navigation/ScrollAwareBottomNav.tsx");
  const bottomNav = readSource("src/components/navigation/BottomNav.tsx");
  const menu = readSource("src/components/navigation/MenuBottomSheet.tsx");
  const dialog = readSource("src/hooks/useModalDialog.ts");
  for (const label of [
    "Templates",
    "Examples",
    "Concierge",
    "More ways",
    "Menu",
    "Weddings",
    "Birthdays",
    "Baby Showers",
    "Bridal Showers",
    "Gender Reveals",
    "Signup Forms",
    "Sports",
    "Gymnastics",
    "Guides",
    "Contact",
    "Privacy",
    "Terms",
  ]) {
    assert.ok(navigation.includes(`label: "${label}"`), `${label} remains available`);
  }
  for (const anchor of ["#examples", "#showcase", "#creation-paths"])
    assert.ok(navigation.includes(anchor));
  assert.match(scrollNavigation, /#landing-hero/);
  assert.match(scrollNavigation, /new IntersectionObserver/);
  assert.match(scrollNavigation, /!entry\.isIntersecting/);
  assert.match(scrollNavigation, /aria-hidden=\{!showNav\}/);
  assert.match(scrollNavigation, /inert=\{!showNav\}/);
  assert.match(scrollNavigation, /<ConciergeLauncher visible=\{showDesktopConcierge\}/);
  assert.match(bottomNav, /aria-label="Signed-out mobile navigation"/);
  assert.match(bottomNav, /prefers-reduced-motion: reduce/);
  assert.match(bottomNav, /document\.getElementById\(href\.slice\(1\)\)/);
  assert.match(menu, /navLinks = signedOutMobileMenuLinks/);
  assert.match(menu, /aria-label="Signed-out mobile menu"/);
  assert.match(menu, /useModalDialog\(/);
  assert.match(menu, /<LoginForm/);
  assert.match(menu, /<SignupForm/);
  assert.match(menu, /successRedirectUrl=\{successRedirectUrl\}/);
  assert.match(menu, /successRedirectUrl=\{signupSuccessRedirectUrl\}/);
  assert.match(dialog, /event\.key === "Escape"/);
  assert.match(dialog, /event\.key !== "Tab"/);
  assert.match(dialog, /window\.scrollTo\(0, scrollY\)/);
});

test("landing keeps question help separate from creation and preserves real live examples", () => {
  const landing = readSource("src/app/landing/LandingExperience.tsx");
  const concierge = readSource("src/components/navigation/ConciergeSheet.tsx");
  const showcase = readSource("src/components/landing/LandingLiveCardShowcase.tsx");
  const snapshots = readSource("src/components/landing/landing-live-card-snapshots.ts");
  assert.match(landing, /<ConciergeSheet/);
  assert.match(landing, /<ScrollAwareBottomNav/);
  assert.match(landing, /onConciergeSelect=\{openHelpChat\}/);
  assert.match(landing, /onMenuSelect=\{\(\) => setMobileMenuOpen\(true\)\}/);
  assert.match(landing, /onVisibilityChange=\{setBottomNavVisible\}/);
  assert.match(concierge, /Envitefy Concierge/);
  assert.match(concierge, /Questions about Envitefy/);
  assert.match(concierge, /Ask me anything about creating or sharing your event/);
  assert.match(concierge, /guestChatStarterQuestions\.map\(/);
  assert.match(concierge, /signupSuggested/);
  assert.match(concierge, /stream: true/);
  assert.match(landing, /<LandingLiveCardShowcase/);
  assert.match(landing, /DeferredShowcase/);
  assert.match(showcase, /sectionId = "showcase"/);
  assert.match(showcase, /id=\{sectionId\}/);
  assert.match(showcase, /StudioShowcaseLiveCard/);
  assert.match(showcase, /landingShowcasePreviews\.map/);
  assert.match(showcase, /interactive=\{activeIndex === index\}/);
  assert.match(showcase, /Open live card/);
  assert.doesNotMatch(showcase, /createMarketingInvitationData|\/api\/blob\/event-media\//);
  assert.doesNotMatch(snapshots, /\/api\/blob\/event-media\//);
  assert.match(snapshots, /\/images\/landing\/live-cards\//);
});

test("shared category authentication keeps intent, destination and explicit form submission", () => {
  const chrome = readSource("src/components/navigation/SignedOutPageChrome.tsx");
  const modal = readSource("src/components/auth/AuthModal.tsx");
  const login = readSource("src/components/auth/LoginForm.tsx");
  const signup = readSource("src/components/auth/SignupForm.tsx");
  assert.match(chrome, /marketingPageNavLinks\(pathname \|\| ""\)/);
  assert.match(
    chrome,
    /const successRedirectUrl =\s*authMode === "signup" \? signupSuccessRedirectUrl : loginSuccessRedirectUrl/,
  );
  assert.match(chrome, /signupSource=\{signupSource\}/);
  assert.match(chrome, /signupIntent=\{signupIntent \|\| undefined\}/);
  assert.match(modal, /<LoginForm[\s\S]*successRedirectUrl=\{successRedirectUrl\}/);
  assert.match(modal, /<SignupForm[\s\S]*successRedirectUrl=\{successRedirectUrl\}/);
  assert.match(login, /callbackUrl: successRedirectUrl/);
  assert.match(signup, /callbackUrl: successRedirectUrl/);
  assert.doesNotMatch(chrome, /allowSignupSwitch=\{false\}/);
});

test("marketing footer keeps product, resource and legal destinations", () => {
  const landing = readSource("src/app/landing/LandingExperience.tsx");
  const footer = readSource("src/components/ConditionalFooter.tsx");
  assert.doesNotMatch(landing, /<footer\b/);
  assert.match(footer, /MARKETING_FOOTER_GROUPS/);
  assert.match(footer, /"\/landing"/);
  for (const destination of [
    "/#creation-paths",
    "/#guest-flow",
    "/weddings",
    "/signup-forms",
    "/privacy",
    "/terms",
    "/contact",
    "/snap",
    "/showcase",
    "/guides/rsvp-event-page",
    "/guides/share-event-page-without-app",
  ]) {
    assert.ok(footer.includes(`href: "${destination}"`), `${destination} remains linked`);
  }
  assert.doesNotMatch(footer, /href: "\/use-cases/);
});
