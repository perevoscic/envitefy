const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === "lucide-react") {
    const file = path.join(process.cwd(), "node_modules/lucide-react/dist/cjs/lucide-react.js");
    const mod = new Module(file, parent);
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(fs.readFileSync(file, "utf8"), file);
    return mod.exports;
  }
  return originalLoad.call(this, request, parent, isMain);
};
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  return resolve.call(this, request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request, parent, ...rest);
};
for (const ext of [".ts", ".tsx"]) Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
Module._extensions[".css"] = mod => { mod.exports = new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) }); };
const React = require("react");
const { renderToStaticMarkup: render } = require("react-dom/server");
const Tone = require("./TemplateImageTone.tsx").default;
const { resolveTemplateImageColor: color } = require("../../lib/template-image-tone.ts");
const image = "/uploads/original-photo.webp";
function check(html, accent, label) {
  assert.ok(html.includes('flood-color="' + color(accent) + '"'), label + ": matching accent");
  assert.ok(html.includes('flood-opacity="0.55"'), label + ": stronger automatic tint");
  assert.ok(html.includes("--template-image-filter:"), label + ": scoped filter");
  assert.ok(html.includes("template-hero-image"), label + ": actual artwork uses tint");
  assert.ok(html.includes(image), label + ": original image source preserved");
}
test("template accents resolve from CSS colors and named/arbitrary Tailwind palettes", () => {
  assert.equal(color("text-[#83709c]"), "#83709c");
  assert.equal(color("#d4af37"), "#d4af37");
  assert.equal(color("text-emerald-600"), require("tailwindcss/colors").emerald[600]);
  assert.equal(color("text-rose-500/80"), require("tailwindcss/colors").rose[500]);
  assert.equal(color(undefined), "#83709c");
});
test("neighboring templates have independent filters and preserve root styles", () => {
  const html = render(React.createElement(React.Fragment, null,
    ...["#83709c", "#25634a"].map(accent => React.createElement(Tone, { color: accent, key: accent },
      React.createElement("section", { style: { backgroundColor: "white" } },
        React.createElement("img", { src: image, alt: "", className: "template-hero-image" }),
        React.createElement("button", null, "Change image"))))));
  const ids = [...html.matchAll(/<filter id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, 2);
  assert.equal((html.match(/background-color:white/g) || []).length, 2);
  assert.equal((html.match(/<button>Change image<\/button>/g) || []).length, 2);
});
test("all birthday and anniversary designs tint the saved uploaded hero", () => {
  const { CELEBRATION_DESIGN_CATALOG: designs } = require("../../data/birthday-design-catalog.ts");
  const Renderer = require("../birthdays/BirthdayRenderer.tsx").default;
  assert.equal(designs.length, 150);
  for (const design of designs) {
    const props = JSON.parse(JSON.stringify({ template: design, event: { birthdayName: "Alex", date: "2026-10-17T14:00:00", location: "Garden", gallery: [] }, heroImageUrl: image }));
    check(render(React.createElement(Renderer, props)), design.secondaryColor, design.id);
  }
});


test("turning the filter off survives event draft saves and every public renderer", () => {
  const { buildTemplateDraftPayload } = require("../../lib/template-draft-payload.ts");
  const checkOff = (Component, props, label) => {
    const restored = JSON.parse(JSON.stringify(props));
    const html = render(React.createElement(Component, restored));
    assert.ok(html.includes("--template-image-filter:opacity(1)"), label);
    assert.ok(html.includes(image), label + ": original image preserved");
    assert.ok(!html.includes("--template-image-filter:url("), label + ": no active tint");
  };
  for (const category of ["birthdays", "anniversaries", "weddings", "baby-showers", "bridal-showers", "gender-reveal", "gymnastics", "sport-events"]) {
    const payload = buildTemplateDraftPayload({ data: { heroImage: image, heroImageFilterEnabled: false } }, category, "America/Chicago");
    const restored = JSON.parse(JSON.stringify(payload));
    assert.equal(restored.data.heroImageFilterEnabled, false, category);
    assert.equal(restored.data.heroImage, image, category);
  }
  const { CELEBRATION_DESIGN_CATALOG } = require("../../data/birthday-design-catalog.ts");
  const Birthday = require("../birthdays/BirthdayRenderer.tsx").default;
  for (const template of CELEBRATION_DESIGN_CATALOG)
    checkOff(Birthday, { template, event: { birthdayName: "Alex", gallery: [] }, heroImageUrl: image, heroImageFilterEnabled: false }, template.id);
  const Wedding = require("../weddings/WeddingRenderer.tsx").default;
  for (const design of JSON.parse(fs.readFileSync("templates/weddings/index.json", "utf8"))) {
    const template = JSON.parse(fs.readFileSync("templates/weddings/" + design.id + "/config.json", "utf8"));
    template.theme.decorations = { ...template.theme.decorations, heroImage: image };
    checkOff(Wedding, { template, hideGuestTools: true, event: { headlineTitle: "Alex & Sam", customHeroImage: image, heroImageFilterEnabled: false, gallery: [{ url: image }], schedule: [], rsvpEnabled: false } }, design.id);
  }
  const { BABY_SHOWER_DESIGNS } = require("../../lib/baby-shower-designs.ts");
  const Baby = require("../baby-showers/BabyShowerDesignHero.tsx").default;
  for (const design of BABY_SHOWER_DESIGNS)
    checkOff(Baby, { design, eventTitle: "Baby shower", heroImage: image, filterEnabled: false }, design.id);
  const { genderRevealDesigns } = require("../../lib/gender-reveal-designs.ts");
  const Reveal = require("../gender-reveal/GenderRevealScene.tsx").default;
  for (const design of genderRevealDesigns)
    checkOff(Reveal, { design, title: "Surprise", image, filterEnabled: false }, design.id);
  const { BRIDAL_PRESETS } = require("../../lib/public-template-catalog.ts");
  const Bridal = require("../templates/BridalShowerPreview.tsx").default;
  for (const design of BRIDAL_PRESETS)
    checkOff(Bridal, { templateId: design.id, data: { images: { hero: image }, heroImageFilterEnabled: false } }, design.id);
});
test("signup filter-off survives sanitizing and a palette change", () => {
  const { getPublicTemplates } = require("../../lib/public-template-catalog.ts");
  const { createSignupTemplateForm } = require("../../lib/signup-starters.ts");
  const { applySignupTheme } = require("../../lib/signup-themes.ts");
  const { sanitizeSignupForm } = require("../../utils/signup.ts");
  const Header = require("../smart-signup-form/SignupTemplateHeader.tsx").default;
  for (const template of getPublicTemplates("signup-forms")) {
    const form = createSignupTemplateForm(template);
    form.appearance.imageFilterEnabled = false;
    form.header.backgroundImage = { dataUrl: image, name: "Original", type: "image/webp" };
    form.header.images = [];
    const saved = sanitizeSignupForm(JSON.parse(JSON.stringify(form)));
    assert.equal(saved.appearance.imageFilterEnabled, false, template.id);
    assert.ok(render(React.createElement(Header, { form: saved })).includes("--template-image-filter:opacity(1)"), template.id);
    assert.equal(applySignupTheme(saved, "clean-clear").appearance.imageFilterEnabled, false, template.id);
  }
});
test("all wedding designs tint their uploaded hero after a saved payload round trip", () => {
  const designs = JSON.parse(fs.readFileSync("templates/weddings/index.json", "utf8"));
  const Renderer = require("../weddings/WeddingRenderer.tsx").default;
  const missing = [];
  for (const design of designs) {
    const template = JSON.parse(fs.readFileSync("templates/weddings/" + design.id + "/config.json", "utf8"));
    template.theme.decorations = { ...template.theme.decorations, heroImage: image };
    const props = JSON.parse(JSON.stringify({ template, hideGuestTools: true, event: { headlineTitle: "Alex & Sam", couple: { partner1: "Alex", partner2: "Sam" }, customHeroImage: image, gallery: [{ url: image }], date: "2026-10-17", schedule: [], rsvpEnabled: false } }));
    const html = render(React.createElement(Renderer, props));
    try { check(html, template.theme.colors.accent || template.theme.colors.secondary, design.id); }
    catch (error) { missing.push(error.message); }
  }
  assert.deepEqual(missing, []);
});
test("football designs preserve original artwork colors, including legacy filter settings", () => {
  const { FOOTBALL_DESIGNS } = require("../football-season-templates/footballDesigns.ts");
  const Hero = require("../football-season-templates/FootballHero.tsx").default;
  for (const [id, design] of Object.entries(FOOTBALL_DESIGNS)) {
    for (const heroSrc of [undefined, image]) {
      for (const filterEnabled of [undefined, true, false]) {
        const html = render(React.createElement(Hero, { templateId: id, title: "Team season", heroSrc, filterEnabled }));
        assert.ok(!html.includes("template-image-filter"), id + ": no added tint");
        assert.ok(!html.includes("<filter"), id + ": no SVG color filter");
        const source = heroSrc || design.hero;
        assert.ok(html.includes(source) || html.includes(encodeURIComponent(source)), id + ": original artwork preserved");
        assert.equal(html.includes("bg-gradient-to-t"), design.layout === "cinematic", id + ": native text scrim preserved");
      }
    }
  }
});
test("baby shower, bridal shower and gender reveal collections tint uploaded art", () => {
  const { BABY_SHOWER_DESIGNS } = require("../../lib/baby-shower-designs.ts");
  const Baby = require("../baby-showers/BabyShowerDesignHero.tsx").default;
  for (const design of BABY_SHOWER_DESIGNS)
    check(render(React.createElement(Baby, { design, eventTitle: "Baby shower", heroImage: image, dateLabel: null, timeLabel: null, eventId: "", shareUrl: "", preview: true })), design.colors.accent, design.id);
  const { genderRevealDesigns } = require("../../lib/gender-reveal-designs.ts");
  const Reveal = require("../gender-reveal/GenderRevealScene.tsx").default;
  for (const design of genderRevealDesigns)
    check(render(React.createElement(Reveal, { design, title: "Our surprise", image })), design.accent, design.id);
  const { BRIDAL_PRESETS } = require("../../lib/public-template-catalog.ts");
  const Bridal = require("../templates/BridalShowerPreview.tsx").default;
  for (const design of BRIDAL_PRESETS)
    check(render(React.createElement(Bridal, { templateId: design.id, data: { images: { hero: image } } })), design.accent, design.id);
});
test("all signup designs and photo layouts keep their automatic palette after sanitizing", () => {
  const { SIGNUP_DESIGNS } = require("../../lib/signup-designs.ts");
  const { createSignupTemplateForm } = require("../../lib/signup-starters.ts");
  const { getPublicTemplates } = require("../../lib/public-template-catalog.ts");
  const templates = getPublicTemplates("signup-forms");
  const { resolveSignupThemeStyle } = require("../../lib/signup-themes.ts");
  const { sanitizeSignupForm } = require("../../utils/signup.ts");
  const Header = require("../smart-signup-form/SignupTemplateHeader.tsx").default;
  for (const design of SIGNUP_DESIGNS) {
    const form = createSignupTemplateForm(templates.find(template => template.id === design.id));
    form.header.backgroundImage = { dataUrl: image, name: "Original", type: "image/webp" };
    form.header.images = [];
    const saved = sanitizeSignupForm(JSON.parse(JSON.stringify(form)));
    check(render(React.createElement(Header, { form: saved })), resolveSignupThemeStyle(saved)["--signup-accent"], design.id);
  }
  for (const layout of ["header-1", "header-2", "header-3", "header-4", "header-5", "header-6"]) {
    const form = createSignupTemplateForm(templates[0]);
    form.appearance.headerLayout = layout;
    form.header.images = [1,2,3].map(i => ({ dataUrl: image, name: "Photo " + i, type: "image/webp" }));
    check(render(React.createElement(Header, { form })), resolveSignupThemeStyle(form)["--signup-accent"], layout);
  }
});
