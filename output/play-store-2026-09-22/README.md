# Envitefy Play Store screenshots

Eight portrait screenshots, 1080 × 1920 pixels, RGB PNG with no alpha. The `upload` folder and ZIP contain the store deliverables. Upload in filename order, 01 through 08.

Each neighboring pair is cut from one 2160 × 1920 composition so the phone, background and linework continue exactly across the boundary:

1. Dream it. Invite them. — Live Cards and invitations.
2. One link. Everyone in. — RSVP, directions, calendar and registry.
3. Snap it. It’s a plan. — Invitations, flyers and PDF import.
4. Save the date. Skip the typing. — Calendar actions.
5. Less chasing. More helping. — Sign-up forms.
6. Pick a slot. You’re in. — Guest sign-ups without an account.
7. All your plans. One happy place. — Event dashboard.
8. Less organizing. More enjoying. — Find the next event.

Open `index.html` for the review gallery and individual downloads. `all-eight-preview.webp` shows all four pairs. `carousel-preview.webp` shows their horizontal order. `design.html?pair=1` through `?pair=4` display the full-size compositions.

## Sources and reproduction

The phone screens use the production `SharedStudioCardFrame`, `ScannedInviteSkin`, `SignupPageRenderer` / `SignupViewer`, and `HomeOverviewDashboard` React components with fictional sample event data. These are local component captures, not captures from a signed-in Android device. The sample navigation wrapper and Android device frame belong only to these marketing layouts. No app data was created or changed, and nothing was uploaded to Play Console.

Artwork comes from existing repository marketing and template assets. No new AI raster artwork was generated. The locked wordmark uses the bundled Josefin Slab font and canonical tracking, padding and gradient. The app source and logo component were not changed.

From the repository root:

```powershell
node output/play-store-2026-09-22/capture-app.cjs
node output/play-store-2026-09-22/render.cjs
```

`render.cjs` is the editable design source; `copy-and-layout.json` records the current wording. The paired WebP proofs are encoded directly from browser PNG buffers using FFmpeg libwebp, quality 85, compression level 6. Intermediate PNG buffers are not written to disk. Final PNGs are retained as the specifically requested Google Play delivery format.

`verification.json` records dimensions, color channels and file sizes. `app-screens/capture-report.json` records zero broken images and zero horizontal overflow in each app capture.

Google's [preview asset requirements](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en) were checked September 22, 2026. They accept JPEG or 24-bit PNG screenshots without alpha and allow stylized screenshots that split UI across multiple uploaded images. A 1080 × 1920 portrait image meets the recommended screenshot resolution and aspect ratio. Export validation does not imply Play Console review or approval.
