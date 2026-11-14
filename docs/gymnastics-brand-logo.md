# Approved gymnastics logo

Approved by the user on November 14, 2026 for gymnastics emails and anything gymnastics-related. The authoritative policy is in [ENVITEFY_BRAND.md](../ENVITEFY_BRAND.md).

- Delivery asset: `public/brand/gymnastics-v1/envitefy-gymnastics-logo.webp`.
- Registry: `ENVITEFY_BRAND_ASSETS.gymnastics` in `src/lib/brand-assets.ts`.
- Dimensions: 1057 × 440; preserve the complete gymnast, gradient wordmark and `.com`.
- User attachment SHA-256: `44416a92e7a012a5663aab5d87f09547eef10bc90c60967f59c24bebc35c14e1`.
- Prepared WebP SHA-256: `57a6c12a4d46e1af5fc2797dab5c502b59736578d18129f29673011cd1d433d0`.

The original attachment is a 16-bit RGBA PNG. It was normalized to sRGB/8-bit for WebP, then encoded losslessly with the repository's FFmpeg preparation workflow. Comparison with the attachment decoded to 8-bit RGBA found zero differing alpha values and zero differing visible RGB pixels. The protected user attachment remains unchanged; the temporary normalized PNG was removed by the preparation tool.

`EnvitefyGymnasticsLogo` displays the supplied asset directly. `EnvitefyRouteBrand` selects it for gymnastics navigation and galleries; `EnvitefyEventBranding` selects it for gymnastics meet pages, including saved event pages. Other categories retain the canonical general wordmark. Use the full mark for future gymnastics emails, social posts, ads and exports; do not redraw it or ask a model to generate it.

`createEmailTemplate` selects the gymnastics mark from `brandCategory` or gymnastics campaign copy. Event sharing, co-host invitations, RSVP confirmations/host alerts and host announcements pass their saved event category so a meet named only “Winter Classic” still receives the correct logo. The email header places the transparent mark on a light plate inside the existing dark brand band, with proportional dimensions and no regenerated artwork.

Historical saved/delivered legacy compositions and authored full-document email HTML retain their original assets. New or revised gymnastics compositions should use the approved asset as an HTML/composition layer, separately from photography.
