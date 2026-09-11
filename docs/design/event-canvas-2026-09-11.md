# Event canvas standard — September 11, 2026

An event's actual page background color fills the surrounding canvas, page gutters, navigation and safe areas. The color updates when its design or palette changes and is released when the event closes.

`EventCanvas` reads the rendered event surface and uses the existing event color registration. This covers the public event dispatcher, fourteen category creation previews, public signup forms, signup Design/Review previews, and in-memory device previews. Each iframe registers its color in its own document. Existing image and gradient preview continuity stays in the shared preview background controller; hero artwork and individual section surfaces retain their designs.

The canvas skips hidden artwork, inert thumbnails, dialogs, positioned decorations and short control bars. Legacy `event-modern-page` gutters become transparent so they inherit the event canvas instead of drawing the old application gradient. No background markers are added to template surfaces during hydration.

Device previews are a separate product choice: use Desktop, Tablet and Mobile in the Design step while keeping the published event responsive. This change does not add a fixed aspect-ratio choice or another device selector.

## Verification

- Browser rendering of all 585 catalog templates at 1280px and 375px: canvas colors register and match their navigation color; no runtime errors or new overflow in redesigned bodies. Existing overflow in some preserved designs remains recorded by the body audit harness.
- The Maple Mitten design from the reference was visually checked at both widths.
- Live light/dark palette changes, iframe document isolation and cleanup on unmount are covered by the browser fixture.
- 33 canvas, event chrome, device preview and signup regression tests pass.
- Biome reports no new issues. Comparing 28 changed/new TypeScript files to the Git baseline finds zero new diagnostics; the public event route retains its 19 existing errors. The VS Code diagnostics bridge was unavailable, so TypeScript was checked directly.

Run `node scripts/verify-template-bodies.cjs --canvas` for the collection. Use `--category=gender-reveal --id=maple-mitten --screens` for the reference design and lifecycle checks. The harness uses real renderers with mocked session/maps, writes local screenshots and reports, and never saves an event. Remote fonts may fall back when unavailable.
