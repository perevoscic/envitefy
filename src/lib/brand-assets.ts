/** Versioned, approved Envitefy branding. Keep legacy URLs stable for sent mail and exports. */
export const ENVITEFY_BRAND_ASSETS = {
  symbol: {
    color: "/brand/e-only.png",
    white: "/brand/white-v1/e-only.png",
    emailWhite: "/email/white-v1/e-only.png",
    emailWhiteMatte: "/email/white-v1/matte/e-only.png",
  },
  wordmark: {
    color: "/brand/wordmark-v2/envitefy-wordmark.webp",
    white: "/brand/wordmark-v2/envitefy-wordmark-white.webp",
    colorSrcSet: [150, 300, 450, 600, 900].map((width) => `/brand/responsive-v1/wordmark-${width}.webp ${width}w`).concat("/brand/wordmark-v2/envitefy-wordmark.webp 1194w").join(", "),
    whiteSrcSet: [150, 300, 450, 600, 900].map((width) => `/brand/responsive-v1/wordmark-white-${width}.webp ${width}w`).concat("/brand/wordmark-v2/envitefy-wordmark-white.webp 1194w").join(", "),
    emailColor: "/email/wordmark-v2/envitefy-wordmark-email.gif",
    emailWhite: "/email/wordmark-v2/envitefy-wordmark-email-white.gif",
    emailWhiteMatte: "/email/wordmark-v2/matte/envitefy-wordmark-email.gif",
  },
} as const;
