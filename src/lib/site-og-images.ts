export const SITE_OG_IMAGE_WIDTH = 1200;
export const SITE_OG_IMAGE_HEIGHT = 630;
export const SITE_OG_IMAGE_ALT = "Envitefy preview";

export const SITE_OG_IMAGE_PATHS = [
  "/og/og-1.jpg",
  "/og/og-2.jpg",
  "/og/og-3.jpg",
  "/og/og-4.jpg",
  "/og/og-5.jpg",
  "/og/og-6.jpg",
  "/og/og-7.jpg",
  "/og/og-8.jpg",
] as const;

export function getRandomSiteOgImagePath(): string {
  const index = Math.floor(Math.random() * SITE_OG_IMAGE_PATHS.length);
  return SITE_OG_IMAGE_PATHS[index] || SITE_OG_IMAGE_PATHS[0];
}

export function getRandomSiteOgImageUrl(origin = "https://envitefy.com"): string {
  return `${origin.replace(/\/+$/, "")}${getRandomSiteOgImagePath()}`;
}

export function buildSiteOgImage(url: string, alt = SITE_OG_IMAGE_ALT) {
  return {
    url,
    width: SITE_OG_IMAGE_WIDTH,
    height: SITE_OG_IMAGE_HEIGHT,
    alt,
  };
}
