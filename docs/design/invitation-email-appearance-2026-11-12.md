# Invitation email appearance

The shared adaptive email template preserves the emblem's 256 × 165 source
proportions at 56 × 36 display pixels, with automatic height when CSS is available.
The 1194 × 402 wordmark displays at 164 × 55. Historical delivery assets and saved
legacy campaigns retain their original URLs.

Primary actions pair lavender `#C5A7FF` with plum `#25103E`, including inline
text-fill on the label and a same-color background gradient. These survive
head-style removal and simulated inbox link recoloring. Outlook dark selectors
cover the same native content surfaces and headings as the dark media rules.

New adaptive email branding uses lossless WebP derivatives of the existing
approved matte sources; no artwork or logo geometry was regenerated:

- `public/email/white-v1/matte/e-only.png` → `e-only.webp`
- `public/email/wordmark-v2/matte/envitefy-wordmark-email.gif` → `envitefy-wordmark-email.webp`
- `public/email/white-v1/matte/social-{instagram,facebook,youtube,tiktok,reddit}.png` → matching `.webp`

Each derivative was encoded with FFmpeg using `-frames:v 1 -c:v libwebp
-lossless 1 -compression_level 6`, then verified with ffprobe for WebP encoding
and unchanged dimensions. The protected original inputs remain intact.

Verification uses `node scripts/run-email-tests.mjs` and
`node --test scripts/email-appearance-browser.test.cjs`. The browser matrix
checks light, dark and Outlook-style dark appearance at 320, 375, 600 and 800px,
including text contrast, loaded assets, logo proportions and horizontal overflow.
Co-host checks also remove head styles and simulate forced link recoloring.
Screenshots and reports are written to `output/email-appearance/`. These are
browser simulations; actual inbox rendering still depends on the mail client.
