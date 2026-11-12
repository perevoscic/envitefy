const fs = require("node:fs");
const inventory = require("./lib/application-color-inventory.cjs")();
const filename = "src/styles/app-appearance.css";
const marker = "/* Generated application status utilities.";
const groups = {
  error: ["red", "rose"],
  success: ["green", "emerald", "teal"],
  warning: ["amber", "yellow", "orange"],
  info: ["blue", "sky", "cyan"],
  primary: ["purple", "violet", "indigo", "pink"],
};
const exclude = ':not([data-appearance-scope="authored"], [data-appearance-scope="authored"] *)';
const selector = tokens => `html.dark :is(\n${tokens.map(token => `  [class~=${JSON.stringify(token)}]${token.startsWith("hover:") ? ":hover" : ""}`).join(",\n")}\n)${exclude}`;
const rules = [];
for (const [role, families] of Object.entries(groups)) {
  const matches = token => families.some(family => token.includes(`-${family}-`));
  for (const hovered of [false, true]) {
    const tokens = Object.keys(inventory.surfaces).filter(token => matches(token) && token.startsWith("hover:") === hovered);
    if (tokens.length) rules.push(`${selector(tokens)} { background-color: color-mix(in srgb, var(--${role}) ${hovered ? 20 : 13}%, var(--surface)); }`);
  }
  const tokens = Object.keys(inventory.inks).filter(matches);
  if (tokens.length) rules.push(`${selector(tokens)} { color: var(--${role}); }`);
}
const original = fs.readFileSync(filename, "utf8").split(marker)[0].trimEnd();
fs.writeFileSync(filename, `${original}\n\n${marker} Regenerate with node scripts/update-application-status-colors.cjs.\n   Exact source utilities only; authored designs keep their own colors. */\n${rules.join("\n")}\n`);
console.log(`Updated ${rules.length} source-derived status color groups.`);
