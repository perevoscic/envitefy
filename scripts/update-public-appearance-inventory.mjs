import fs from "node:fs/promises";

// Exact utility inventory for public marketing shells. This deliberately stays
// separate from application compatibility styles and excludes authored previews.
const files = [
  "src/app/about/page.tsx",
  "src/components/company/CompanyPageShell.tsx",
  "src/app/contact/page.tsx",
  "src/app/faq/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/terms/page.tsx",
  "src/app/guides/page.tsx",
  "src/app/guides/guide-content.tsx",
  "src/app/how-it-works/page.tsx",
  "src/app/landing/sections/HowItWorks.tsx",
  "src/components/ui/glassmorphism-trust-hero.tsx",
  "src/components/landing/SnapEventPreview.tsx",
  "src/app/forgot/page.tsx",
  "src/app/reset/ResetPasswordPageClient.tsx",
  "src/app/unsubscribe/page.tsx",
  "src/app/category-pages/CategoryLandingView.tsx",
  "src/app/category-pages/GenderRevealEditorialSections.tsx",
  "src/app/category-pages/SignupFormsEditorialSections.tsx",
  "src/app/birthdays/BirthdaysLandingView.tsx",
  "src/app/birthdays/_components/BirthdayHero.tsx",
  "src/app/birthdays/_components/BirthdayEditorialSections.tsx",
  "src/app/birthdays/_components/BirthdayInvitationDemo.tsx",
  "src/app/birthdays/_components/BirthdayPromptStudio.tsx",
  "src/app/birthdays/_components/BirthdaySectionIntro.tsx",
  "src/app/weddings/WeddingStudioPreview.tsx",
  "src/app/weddings/WeddingsLandingView.tsx",
  "src/components/sports-landing/SportsLandingPage.tsx",
  "src/components/gymnastics-landing/GymnasticsLanding.tsx",
  "src/components/gymnastics-landing/GymnasticsLandingFaq.tsx",
  "src/components/snap-landing/SnapLanding.tsx",
  "src/app/baby-showers/BabyShowersLandingView.tsx",
  "src/app/bridal-showers/BridalShowersLandingView.tsx",
  "src/app/anniversaries/page.tsx",
  "src/components/football-landing/FootballLanding.tsx",
];
const inventory = {
  surface: new Set(),
  text: new Set(),
  muted: new Set(),
  border: new Set(),
  gradient: new Set(),
};
const luminance = (hex) => {
  const raw = hex.slice(1);
  const full = raw.length === 3 ? [...raw].map((c) => c + c).join("") : raw;
  return [0, 2, 4]
    .map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
};
for (const file of files) {
  const source = await fs.readFile(file, "utf8");
  for (const match of source.matchAll(/\b(bg|text|border)-\[(#[0-9a-fA-F]{3,8})\](?:\/[\d.]+)?/g)) {
    const [token, property, color] = match;
    if (property === "bg" && luminance(color) > 0.24) inventory.surface.add(token);
    if (property === "text") inventory[luminance(color) > 0.4 ? "muted" : "text"].add(token);
    if (property === "border") inventory.border.add(token);
  }
  for (const match of source.matchAll(/\btext-white\/(\d+)/g))
    if (+match[1] < 80) inventory.muted.add(match[0]);
  for (const match of source.matchAll(/\bbg-\[(?:linear|radial)-gradient\([^\]]+\)\]/g))
    inventory.gradient.add(match[0]);
}
// Local category variables are light palettes supplied by page data.
for (const token of [
  "bg-[var(--use-case-surface)]",
  "bg-[var(--use-case-accent-soft)]",
  "bg-[var(--birthday-yellow)]",
])
  inventory.surface.add(token);
for (const token of [
  "text-[var(--use-case-ink)]",
  "text-[var(--use-case-accent-dark)]",
  "text-[var(--use-case-accent)]",
  "text-[var(--birthday-ink)]",
  "text-[var(--birthday-accent)]",
  "text-[var(--birthday-green)]",
])
  inventory.text.add(token);
for (const token of ["text-[var(--birthday-muted)]"]) inventory.muted.add(token);
const filename = "src/styles/public-appearance.module.css";
const original = (await fs.readFile(filename, "utf8"))
  .split("/* Generated exact utility inventory.")[0]
  .trimEnd();
const scope = ":global(html.dark) .page.page";
const exclude =
  ':not(:global([data-appearance-scope="authored"])):not(:global([data-appearance-scope="authored"] *))';
const rules = Object.entries({
  surface: "background-color: var(--app-surface);",
  text: "color: var(--app-foreground);",
  muted: "color: var(--app-muted-foreground);",
  border: "border-color: var(--app-border);",
  gradient:
    "background-image: linear-gradient(135deg, var(--app-surface-raised), var(--app-surface));",
})
  .map(
    ([kind, body]) =>
      `${scope} :is(\n${[...inventory[kind]]
        .sort()
        .map((token) => `  [class~=${JSON.stringify(token)}]`)
        .join(
          ",\n",
        )}\n)${kind === "gradient" ? ":not(:global(.bg-clip-text)):not(.heroScrim):not(.heroFade):not(.heroTopFade)" : ""}${exclude} { ${body} }`,
  )
  .join("\n\n");
await fs.writeFile(
  filename,
  `${original}\n\n/* Generated exact utility inventory. Run node scripts/update-public-appearance-inventory.mjs. */\n${rules}\n`,
);
console.log(
  `Updated public marketing utility inventory (${Object.values(inventory).reduce((sum, set) => sum + set.size, 0)} classes).`,
);
