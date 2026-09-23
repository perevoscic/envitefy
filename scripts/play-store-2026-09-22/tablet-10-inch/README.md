# Envitefy — 10-inch tablet screenshots

All generated files described below live in the Git-ignored `output/play-store-2026-09-22/tablet-10-inch/` folder at the repository root. Run the phone `capture-app.cjs` first to create the parent `app-screens` markup on a fresh checkout.

Eight separate 2160 × 3840 RGB PNG images, 9:16, with no alpha or visible sequence numbering. Both dimensions fall within the requested 1080–7680 pixel range. Every file is below 8 MB; exact sizes are recorded in `verification.json`.

`envitefy-10-inch-tablet-screenshots.zip` contains only the eight upload images. Open `index.html` for individual previews and downloads. `all-eight-preview.webp` is a review sheet, not an upload image.

Upload the files in this order to preserve the four continuous split-tablet compositions:

- `dream-it-invite-them.png`
- `one-link-everyone-in.png`
- `snap-it-its-a-plan.png`
- `save-the-date.png`
- `less-chasing-more-helping.png`
- `pick-a-slot.png`
- `all-your-plans.png`
- `more-enjoying.png`

Each neighboring pair is sliced at x=2160 from one 4320 × 3840 composition. The colors, headlines, illustrations and split-device style match the previous sets. The dashboard view focuses on the My events / Invited events list at the wider viewport.

## Sources and reproduction

The app views use saved production-component markup with fictional sample data, rendered locally at an 800 × 1280 CSS-pixel portrait viewport and captured at 2000 × 3200 pixels. The marketing wrapper reserves space for navigation and allows the last event section to scroll into view. These are local component renders, not physical-device or emulator captures. No account data was changed and no files were uploaded to Play Console.

The layouts use existing Envitefy artwork and the locked bundled Josefin Slab wordmark. No new AI raster artwork was generated. App captures and paired proofs use FFmpeg libwebp at quality 85, compression level 6. Intermediate PNGs stay in memory. Final PNGs are retained as the user's explicitly requested Play Store deliverables.

Run from the repository root:

```powershell
node scripts/play-store-2026-09-22/capture-tablet.cjs --tablet-10-inch
node scripts/play-store-2026-09-22/render.cjs --tablet-10-inch
```

`verification.json` records image dimensions, color channels, file sizes and aspect ratio. `app-screens/capture-report.json` records image loading and horizontal overflow checks. Local validation does not imply Play Console approval.
