/** Versioned, approved Envitefy branding. Keep legacy URLs stable for sent mail and exports. */
export const ENVITEFY_BRAND_ASSETS = {
  gymnastics: {
    logo: "/brand/gymnastics-v1/envitefy-gymnastics-logo.webp",
    width: 1057,
    height: 440,
  },
  symbol: {
    color: "/brand/e-only.png",
    white: "/brand/white-v1/e-only.png",
    emailWhite: "/email/white-v1/e-only.png",
    emailWhiteMatte: "/email/white-v1/matte/e-only.png",
    emailWhiteMatteWebp: "/email/white-v1/matte/e-only.webp",
  },
  wordmark: {
    color: "/brand/wordmark-v2/envitefy-wordmark.webp",
    white: "/brand/wordmark-v2/envitefy-wordmark-white.webp",
    emailColor: "/email/wordmark-v2/envitefy-wordmark-email.gif",
    emailWhite: "/email/wordmark-v2/envitefy-wordmark-email-white.gif",
    emailWhiteMatte: "/email/wordmark-v2/matte/envitefy-wordmark-email.gif",
    emailWhiteMatteWebp: "/email/wordmark-v2/matte/envitefy-wordmark-email.webp",
  },
} as const;

/** Explicit gymnastics categories, routes and campaign copy share the approved mark. */
export function isGymnasticsBrand(value?: string | null): boolean {
  return Boolean(value && /\bgymnastics?\b|sport[-_ ]?gymnastics|\bgym[\s_-]+meets?\b/i.test(value));
}
