# Envitefy — 7-inch tablet screenshots

All generated files described below live in the Git-ignored `output/play-store-2026-09-22/tablet-7-inch/` folder at the repository root. Run the phone `capture-app.cjs` first to create the parent `app-screens` markup on a fresh checkout.

Eight separate PNG files in `separate`, with no visible numbering and no numeric filename prefixes. Each image is 1440 × 2560 pixels, 9:16, RGB without alpha. File sizes range from 638,725 to 3,090,728 bytes, all below the requested 8 MB limit. Both dimensions are within 320–3840 pixels.

`envitefy-7-inch-tablet-screenshots.zip` contains only the eight upload images. Open `index.html` to preview and download each image separately. The contact sheet `all-eight-preview.webp` is for review, not upload.

Upload in this order to preserve the four continuous split-tablet compositions:

- `dream-it-invite-them.png`
- `one-link-everyone-in.png`
- `snap-it-its-a-plan.png`
- `save-the-date.png`
- `less-chasing-more-helping.png`
- `pick-a-slot.png`
- `all-your-plans.png`
- `more-enjoying.png`

Each pair is sliced from one 2880 × 2560 canvas at x=1440. Colors, headlines and illustrations follow the original phone set; tablet frames and app viewports were adapted for this set.

## Sources and reproduction

App views use saved production-component markup from the parent `app-screens` folder with fictional sample event data, rendered locally at a 600 × 960 CSS-pixel portrait viewport. They are not physical-device or emulator captures. No account data was changed and no files were uploaded to Play Console.

Existing Envitefy artwork and the locked bundled Josefin Slab wordmark are preserved. No new AI raster artwork was generated. WebP app captures and review proofs use FFmpeg libwebp at quality 85 and compression level 6; intermediate PNGs remain in memory. Final PNGs are retained because the user explicitly requested PNG or JPEG delivery for Google Play.

From the repository root:

```powershell
node scripts/play-store-2026-09-22/capture-tablet.cjs
node scripts/play-store-2026-09-22/render.cjs --tablet-7-inch
```

`verification.json` records PNG dimensions, channels, file sizes and aspect ratio. `app-screens/capture-report.json` records image-loading and horizontal-overflow checks. Local export validation does not imply Play Console approval.
