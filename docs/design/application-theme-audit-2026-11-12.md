# Application theme audit — November 12, 2026

The co-host invitation footer combined `bg-slate-50/80` with text that was
converted for dark appearance. That translucent surface was missing from the
shared compatibility rules. The invitation now uses matched semantic card,
secondary-surface, text, border and button roles throughout.

The source inventory traverses every production source under `src`, including
shared class maps and CSS modules (1,654 files in this run). It collects literal
utility colors from application source and records their owning files in
`output/theme-audit/application-color-inventory.json`. CSS modules were also
reviewed for hard-coded light surfaces and local palette overrides.

Corrections include:

- Translucent neutral paper, neutral foregrounds and hover surfaces use dark
  application roles together. Low-opacity white artwork highlights remain
  separate.
- Source-derived warning, success, error, information and accent utilities use
  paired dark surfaces and readable semantic ink. Regenerate their finite
  selector inventory with `node scripts/update-application-status-colors.cjs`.
- The homepage's final call to action inherits the current page palette instead
  of resetting itself to light colors over a transparent canvas. Its narrow
  header also reliably hides the desktop Create action, avoiding overflow.
- Guide review panels use an explicit public-surface role, including their
  headings and body copy. Sports and gymnastics benefit panels adapt together.
- Concierge starters and its composer retain their semantic surface hierarchy
  when shared translucent-paper compatibility is present.
- The gymnastics comparison's PDF container is explicitly authored; the
  surrounding comparison viewport follows application appearance.

No event records, artwork, account sessions or publication state are changed by
these appearance fixes. Existing saved invitation palettes remain authored.

## Repeatable verification

`npm run test:appearance` now includes both
`scripts/application-colors-browser.test.cjs` and
`scripts/public-dark-audit.test.mjs` alongside existing appearance hydration,
signup editing, category, navigation, Settings, branding and runtime CSS checks.

The source-derived browser matrix checks 21,294 neutral/status surface and ink
combinations in dark appearance, including hover states. It verifies that the
same classes retain their original colors inside authored boundaries. These are
system-level combinations, not 21,294 distinct screens.

The public audit renders 31 public, guide and account routes at desktop and phone
widths, checking the complete document for pale application surfaces and low
contrast. Intentional authored samples remain excluded from recoloring.

`node --test scripts/event-collaboration-browser.test.cjs` checks the invitation's
loading, signed-out, ready, wrong-account, expired, accepted and error states in
light/dark appearance at 375px and 1280px. It also retains actual fixture signup,
login, explicit acceptance and co-host/owner permission checks. New invitation
screenshots use FFmpeg WebP in `output/event-collaboration-browser/`.

Outputs and logs belong in ignored `output/theme-audit/`. Browser fixtures use
real components and application styles with offline services. They do not prove
that every account-specific state, dynamic color value or production route has
been visually exercised. Deployment is separate from these local corrections.

Validation: the updated appearance suite passed all 89 tests, including the
62 public-route cases, 21,294 utility-color combinations and authored-design
preservation checks. The seven-state invitation matrix passed all 28 appearance
and viewport cases. Application typecheck, targeted lint, 54 email regressions
and 30 collaboration regressions also passed.

The PDF comparison fixture now supplies the browser environment required by its
real Next Link dependency; the divider, independent scrolling and keyboard/touch
interaction checks pass.

The final standalone homepage interaction suite passed all five tests, including
category fragments, light/dark phone/desktop layouts, assistant panel appearance,
explicit creation and sample actions.
