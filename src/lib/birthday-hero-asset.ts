/** Keep uploaded artwork while upgrading the bundled artwork for a saved design. */
export function resolveBirthdayHeroAsset({
  customHero,
  savedHero,
  catalogHero,
}: {
  customHero?: string | null;
  savedHero?: string | null;
  catalogHero?: string | null;
}) {
  const isBundled = (value: string) =>
    value.startsWith("/templates/birthdays/") ||
    value.startsWith("/templates/anniversaries/") ||
    value.startsWith("/themes/");
  if (customHero && !isBundled(customHero)) return customHero;
  if (savedHero && !isBundled(savedHero)) return savedHero;
  return catalogHero || customHero || savedHero || undefined;
}

/** New collections use absolute asset paths; legacy definitions store a filename. */
export function resolveBirthdayTemplateHero(heroImageName?: string | null) {
  if (!heroImageName) return undefined;
  return heroImageName.startsWith("/") ? heroImageName : `/templates/birthdays/${heroImageName}`;
}
