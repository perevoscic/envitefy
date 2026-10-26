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
    if (name === "@/components/AppearanceProvider")
      return { useTheme: () => ({ theme: "light", setPreference() {} }) };
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
  assert.doesNotMatch(html, /Take a look around\. You can explore designs before signing up\./);
  assert.match(html, /No app needed for guests/);
  assert.match(html, /Beautiful invitations are just the beginning\./);
  assert.match(html, /Collect RSVPs, share schedules and directions/);
  assert.match(html, /keep guests up to date through one link/);
  assert.match(html, /school events and volunteer sign-ups/);
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
    12,
    "Practical questions are available without opening a dialog",
  );
  assert.doesNotMatch(html, /FAQPage|Ask Concierge<\/h1/);
});

test("guest benefits retain four useful capabilities with an upright bold celebration heading", () => {
  const html = renderLanding();
  const section = html.match(/<section id="guest-flow"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(section, "The guest experience retains its public anchor");
  assert.match(section, /Less chasing\. <strong>More celebrating\.<\/strong>/);
  assert.doesNotMatch(section, /<em\b/);
  const cards = [
    ...section.matchAll(/<article\b[^>]*data-guest-benefit[^>]*>([\s\S]*?)<\/article>/g),
  ];
  assert.equal(cards.length, 4, "Four distinct guest capabilities are rendered");
  assert.equal(
    cards
      .map(([, card]) => card.match(/<span[^>]*aria-hidden="true"[^>]*>(\w)<\/span>/)?.[1])
      .join(""),
    "RSVP",
    "Benefit initials spell RSVP in reading order",
  );
  for (const [index, title] of [
    "Know who’s coming.",
    "Everyone brings something.",
    "Get everyone there.",
    "Share the planning.",
  ].entries()) {
    assert.ok(cards[index][1].includes(`<h3>${title}</h3>`), `${title} keeps its semantic title`);
    assert.match(
      cards[index][1],
      /aria-hidden="true"/,
      "Decorative initials are hidden from speech",
    );
  }
  assert.match(section, /Track guest responses and keep your guest list together/);
  assert.match(section, /Organize supplies, potluck dishes, and volunteers with easy sign-ups/);
  assert.match(section, /Keep directions, arrival notes, and event details in one place/);
  assert.match(section, /Add co-hosts to help organize and manage your event/);
  assert.match(section, /href="#showcase"/);
});

test("the rendered design directory keeps all eight public category destinations and real artwork", () => {
  const html = renderLanding();
  assert.equal((html.match(/data-category=/g) || []).length, 8);
  assert.deepEqual(
    [...html.matchAll(/data-category="([^"]+)"/g)].map((match) => match[1]),
    ["weddings", "birthdays", "gymnastics", "baby-showers", "bridal-showers", "gender-reveal", "signup-forms", "sports"],
  );
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
    assert.match(html, new RegExp(`<h3\\b[^>]*>${label}</h3>`));
  }
  for (const [, asset] of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
    assert.ok(asset.startsWith("/"), `Homepage artwork uses local assets: ${asset}`);
    assert.ok(fs.existsSync(path.join(repoRoot, "public", asset.slice(1))), `${asset} exists`);
  }
});

test("the together mosaic keeps seven original artwork destinations among twelve tiles", () => {
  const ArtMosaic = loadLandingComponent("src/app/landing/sections/LandingArtCollage.tsx").default;
  const html = renderToStaticMarkup(React.createElement(ArtMosaic));
  assert.match(html, /data-art-mosaic/);
  assert.match(html, /data-mosaic-stage/);
  assert.match(html, /data-mosaic-grid/);
  assert.match(html, /Every kind of/);
  assert.match(html, /together\./);
  assert.equal((html.match(/data-mosaic-tile=/g) || []).length, 12);
  assert.equal((html.match(/data-collage-card=/g) || []).length, 7);
  const destinations = [
    "/birthdays/templates",
    "/baby-showers/templates",
    "/bridal-showers/templates",
    "/weddings/templates",
    "/sport-events/templates",
    "/gender-reveal/templates",
    "/signup-forms/templates",
  ];
  assert.deepEqual(
    [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]).sort(),
    destinations.sort(),
    "Every existing occasion keeps its public browsing destination",
  );
  const artwork = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)];
  assert.equal(artwork.length, 7, "The mosaic reuses the seven existing Envitefy artworks");
  for (const [, asset] of artwork) {
    assert.ok(asset.startsWith("/images/landing/"), `${asset} remains original local artwork`);
    assert.ok(fs.existsSync(path.join(repoRoot, "public", asset.slice(1))), `${asset} exists`);
  }
});

test("the questions keep practical answers and native no-JavaScript disclosure controls", () => {
  const Questions = loadLandingComponent("src/app/landing/sections/LandingQuestions.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Questions, { onHelp: () => {} }));
  assert.match(html, /data-landing-faq/);
  assert.match(html, /aria-labelledby="faq-heading"/);
  assert.match(html, /<h2 id="faq-heading"[^>]*>Good <strong>questions\.<\/strong>/);
  const questions = [...html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)];
  assert.equal(questions.length, 12, "All twelve answers remain reachable without JavaScript");
  for (const [index, [question, answer]] of [
    [
      "Do my guests need an app?",
      "Your shared invitation or event page opens in a browser on phones, tablets and computers.",
    ],
    [
      "Can I change the details after sharing?",
      "Guests opening the same link will see the updated details",
    ],
    [
      "Can I start with a flyer, PDF or event link?",
      "The event creation workspace offers Upload, Paste URL and Start from scratch.",
    ],
    [
      "Can I explore designs before creating an account?",
      "Browse the public template galleries and try a design first.",
    ],
  ].entries()) {
    assert.ok(questions[index][1].includes(question), `${question} retains its disclosure`);
    assert.ok(questions[index][1].includes(answer), `${question} retains its useful answer`);
    assert.match(questions[index][1], /<summary\b/);
  }
  assert.match(html, /href="\/faq"/);
  assert.match(html, /Ask Concierge/);
  assert.doesNotMatch(html, /<img\b|FAQPage/);
});

test("editorial feedback preserves every existing quote after the practical questions", () => {
  const Testimonials = loadLandingComponent(
    "src/app/landing/sections/LandingTestimonials.tsx",
  ).default;
  const { landingTestimonials } = loadLandingComponent("src/app/landing/landing-data.ts");
  const html = renderToStaticMarkup(React.createElement(Testimonials));
  assert.equal(landingTestimonials.length, 24, "The existing collection contains 24 voices");
  assert.match(html, /id="testimonials"/);
  assert.match(html, /data-landing-testimonials/);
  assert.match(html, /data-feedback-track/);
  const cards = [...html.matchAll(/<figure\b[^>]*data-feedback-card[^>]*>([\s\S]*?)<\/figure>/g)];
  assert.equal(cards.length, 24, "Every existing guest and host quote appears once");
  const escapeText = (text) =>
    renderToStaticMarkup(React.createElement(React.Fragment, null, text));
  for (const [index, testimonial] of landingTestimonials.entries()) {
    for (const key of ["quote", "author", "role", "company"]) {
      assert.ok(
        cards[index][1].includes(escapeText(testimonial[key])),
        `Feedback ${index + 1} preserves its ${key}`,
      );
    }
    assert.match(cards[index][1], /<blockquote\b/);
  }
  assert.match(html, /aria-label="Previous feedback"/);
  assert.match(html, /aria-label="Next feedback"/);
  const decorations = [
    ...html.matchAll(/<[^>]+\bdata-feedback-(?:number|ribbon)(?==|\s|>)[^>]*>/g),
  ];
  assert.ok(decorations.length >= 2, "The editorial layout has its number and ribbon");
  assert.ok(
    decorations.every(([tag]) => /aria-hidden="true"/.test(tag)),
    "Decorative numbers and the occasion ribbon stay outside the accessible reading order",
  );
  assert.match(html, /data-feedback-number/);
  assert.match(html, /data-feedback-ribbon/);
  assert.match(html, /data-feedback-ribbon-track/);
  assert.match(html, /data-feedback-parallax/);
  assert.match(
    html,
    /data-feedback-autoplay="false"/,
    "Server rendering starts with static feedback",
  );
  assert.equal(
    (html.match(/<button\b/g) || []).length,
    2,
    "Only the original feedback arrows appear",
  );
  assert.doesNotMatch(html, /<img\b|images\.unsplash\.com|[★☆]|star-rating/i);
  const homepage = renderLanding();
  assert.ok(
    homepage.indexOf('id="faq-heading"') < homepage.indexOf('id="testimonials"'),
    "Practical questions precede the guest and host feedback",
  );
});

test("header and hero creation continue to Create after authentication while menu login returns home", () => {
  const landing = readSource("src/app/landing/LandingExperience.tsx");
  const html = renderLanding();
  assert.match(landing, /\[authRedirect, setAuthRedirect\] = useState\("\/"\)/);
  assert.match(landing, /onClick=\{onCreateEvent\}[^>]*>\s*Let&apos;s create/);
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
  assert.match(
    wordmark,
    /env<span>itef<\/span><span style=\{\{ marginLeft: "-0\.005em" \}\}>y<\/span>/,
  );
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

test("shared signed-out chrome replaces the bottom bar with Concierge and keeps category menus", () => {
  const navigation = readSource("src/config/navigation.ts");
  const chrome = readSource("src/components/navigation/SignedOutPageChrome.tsx");
  const launcher = readSource("src/components/navigation/ConciergeLauncher.tsx");
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
  assert.match(
    chrome,
    /<ConciergeLauncher open=\{assistantOpen\} onOpen=\{\(\) => setAssistantOpen\(\(open\) => !open\)\}/,
  );
  assert.doesNotMatch(chrome, /ScrollAwareBottomNav|<BottomNav/);
  assert.match(launcher, /visible = true/);
  assert.match(launcher, /open \? "Minimize Envitefy Concierge" : "Open Envitefy Concierge"/);
  assert.match(launcher, /aria-expanded=\{open\}/);
  const html = renderLanding();
  assert.match(html, /data-concierge-launcher="true" data-visible="true"/);
  assert.doesNotMatch(html, /data-mobile-bottom-nav|Signed-out mobile navigation/);
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
  assert.match(
    landing,
    /<ConciergeLauncher open=\{assistantOpen\} onOpen=\{\(\) => setAssistantOpen\(\(open\) => !open\)\}/,
  );
  assert.match(landing, /<LandingQuestions onHelp=\{openHelpChat\}/);
  assert.doesNotMatch(landing, /ScrollAwareBottomNav|bottomNavigation|bottomNavVisible/);
  assert.match(landing, /onClick=\{\(\) => setMobileMenuOpen\(true\)\}/);
  assert.match(concierge, /Envitefy Concierge/);
  assert.match(concierge, /Questions about Envitefy/);
  assert.match(concierge, /Ask me anything about creating or sharing your event/);
  assert.match(concierge, /guestChatStarterQuestions\.map\(/);
  assert.match(concierge, /signupSuggested/);
  assert.match(concierge, /getQuickGuestChatAnswer\(/);
  assert.match(concierge, /requestGuestChatAnswer\(/);
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
