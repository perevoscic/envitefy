# Envitefy Design Guide

## 1. Product Feeling

Envitefy should feel modern, premium, simple, warm, and easy to use.

The core experience should feel like:

"What are we celebrating?" -> collect details -> generate a beautiful live card/event page -> share it.

Avoid making the product feel like a large dashboard, admin hub, or complex menu system.

## 2. Brand Direction

- Use warm event-card surfaces as the base: ivory, soft sand, copper, brown, and warm neutrals.
- Current core tokens appear in `src/app/globals.css` and `src/themes/registry.ts`:
  - Backgrounds: `#F6ECE1`, `#F8F5FF`, `#FBF7F2`
  - Text: `#2B1B16`, `#6A5549`
  - Borders: `#D9C5B8`
  - Warm accent: `#C98F6B`
- Keep the Envitefy wordmark's purple-blue gradient from `src/components/branding/EnvitefyWordmark.tsx` as a brand accent, not the whole app palette.
- Typography should be clean and readable for forms and flows. Use display fonts only for brand moments, event cards, and theme-specific renderers.
- Prefer generous whitespace, clear section hierarchy, and one primary action per view.
- Use soft borders and restrained shadows. Avoid stacking glass, blur, gradients, and heavy shadows in the same surface.
- Product UI should use moderate radius. Public live cards and event skins can be more expressive.

## 3. Core UX Principle

Reduce menus. Guide the user through one simple event-creation conversation.

The strongest current direction is `src/app/studio/workspace/StudioCategoryStep.tsx`, especially the "What are we celebrating?" entry point.

Future creation flows should follow this sequence:

1. Pick event intent or source.
2. Add details or upload/snap an invite.
3. Preview the live card.
4. Publish and share.

Authenticated dashboards, sidebars, and admin tools are secondary surfaces. They should not define the first-time creation experience.

## 4. Main User Flows

- Create from scratch:
  - Primary direction should be `/studio` with `StudioCategoryStep` and `StudioFormStep`.
  - `src/components/EventCreateForm.tsx` is useful but too dense for the main user journey.
  - `src/app/event/new/page.tsx` currently redirects to gymnastics, which is confusing for generic event creation.
- Upload or snap an invite:
  - `/event` and `src/app/event/SnapLaunchCards.tsx` provide a clear snap/upload choice.
  - Dashboard OCR upload lives in `src/components/Dashboard.tsx`.
  - Uploads should distinguish between "I received an invite" and "I am creating my own event."
- Generate a live card:
  - `src/components/studio/StudioShowcaseLiveCard.tsx`
  - `src/components/studio/StudioLiveCardActionSurface.tsx`
  - Public rendering flows through `src/app/event/[id]/page.tsx`.
- Edit and preview:
  - Studio flows support edit/preview behavior.
  - Vertical customize pages exist for birthday, wedding, gymnastics, football, and other categories.
  - Keep preview visible when possible, especially on desktop.
- Share / RSVP / open map:
  - Existing behavior is split across `EventActions`, `EventRsvpPrompt`, `GuestRsvpModal`, `EventMap`, and public event renderers.
  - These actions should become one consistent public event action pattern.

## 5. UI Components

Standardize these reusable patterns:

- Primary, secondary, ghost, and icon buttons.
- Event source picker: snap, upload, create from scratch, URL.
- Category card grid.
- Live card preview frame.
- Public event action rail: RSVP, calendar, directions, share.
- Calendar provider picker.
- RSVP prompt and RSVP modal.
- Form field shell and underlined field style.
- Modal/dialog shell.
- Processing card for OCR/import progress.
- Empty states and loading states.
- Template/gallery card.
- Registry/link card.
- Mobile bottom action bar.

Avoid adding new one-off button, card, and form styles unless the page is a clearly themed public event renderer.

## 6. Mobile-First Rules

- The first mobile screen should show one clear next action.
- Avoid forcing users through desktop-style mega menus.
- Use 44px minimum tap targets.
- Keep RSVP, directions, calendar, and share actions easy to reach on public pages.
- Do not rely on hover states for important controls.
- Keep titles, venues, and long event names wrapped cleanly.
- Use sticky or bottom actions only for primary public-event actions.
- Form steps should be short and progressive.
- Mobile preview should not fight the form for space; switch between compose and preview when needed.

## 7. Animation and Performance Rules

Acceptable animation:

- Short opacity and transform transitions.
- Light panel slide/fade.
- One clear scan/progress animation during upload or OCR.
- Small interaction feedback on buttons and cards.

Avoid:

- Fixed animated backgrounds in app workflows.
- Large persistent backdrop blur on mobile.
- Multiple animated blobs or orbs.
- Heavy scroll-triggered animation on long pages.
- Remote background images that are required for first paint.
- Animations without `prefers-reduced-motion` handling.

Performance-sensitive areas found:

- `src/components/marketing/ScenicBackground.tsx` uses a fixed remote Unsplash background and animated blobs.
- `src/app/landing/LandingExperience.module.css` contains many blur and keyframe effects.
- `src/components/snap/SnapProcessingCard.tsx` has scan/floating animations that should respect reduced motion.
- `nav-chrome-*` and `theme-glass-*` utilities in `src/app/globals.css` use heavy blur and shadows.

## 8. Do / Don't

Do:

- Start creation with "What are we celebrating?"
- Use warm surfaces, clear CTAs, and simple language.
- Keep live card preview close to the editing flow.
- Make public event pages feel polished and shareable.
- Use consistent RSVP, calendar, directions, and share actions.
- Let themed event pages have personality while keeping core actions familiar.

Don't:

- Make users choose from a large menu before their intent is clear.
- Add more dashboard density to creation flows.
- Mix several dominant visual languages on one page.
- Add new glass/orb/blur backgrounds to product workflows.
- Create new one-off button and card systems.
- Use admin-style forms as the default creation experience.
- Use emoji as durable product icons when a proper icon exists.

## 9. Cleanup Opportunities Found in the Codebase

- `src/app/globals.css`
  - Imports many display/script fonts.
  - `body` references `--font-raleway`, but Raleway is not clearly part of the loaded font set.
  - Global `.btn*` styles exist, but many components hard-code their own button styles.
- `src/themes/registry.ts`
  - Theme description says teal/indigo, while the light palette is warm ivory/copper.
- `src/components/navigation/TopNav.tsx`
  - Authenticated navigation is menu-heavy.
  - `CreateEventMenu` uses a very large desktop mega menu.
- `src/app/left-sidebar.tsx` and `src/app/left-sidebar.model.ts`
  - Sidebar supports many modes and categories. Useful for returning users, but too complex as a primary creation model.
- `src/components/MainContentWrapper.tsx` and `src/components/ui/gradient-backgrounds.tsx`
  - Fixed purple radial background can make the app feel more like a dashboard than a warm event-card creator.
- `src/app/event/new/page.tsx`
  - Redirects to `/event/gymnastics`, which is unexpected for generic "new event."
- `src/components/EventCreateForm.tsx`
  - Dense manual form with many fields. Better as an advanced path than the main creation flow.
- `src/components/home/*Hero.tsx`
  - Repeated pastel hero/card patterns should become shared category/source card components.
- `src/components/snap-landing/SnapLanding.tsx`
  - Dark glass marketing style differs from the warm Envitefy direction.
  - Trust names should be verified before being treated as customer proof.
- `src/components/marketing/ScenicBackground.tsx`
  - Fixed remote image and animated background effects are risky for mobile performance.
- `src/components/EventActions.tsx`, `EventRsvpPrompt.tsx`, `GuestRsvpModal.tsx`, and `StudioLiveCardActionSurface.tsx`
  - RSVP, calendar, share, and directions patterns overlap and should be unified.
- `src/components/AccessCodeGate.tsx`
  - Copy references a coach, which is too specific for all passcoded events.
- `src/app/event/[id]/page.tsx`
  - Public event rendering has many one-off action/header/mobile bar patterns.
  - A shared public event action rail would improve consistency.
- `src/components/ScannedInviteSkin.tsx`
  - Strong direction for mobile live cards. Keep the polished public-card feel, but avoid carrying excessive animation or roundness into all product UI.

## 10. Implementation Notes

- Make `/studio` or a similar guided flow the default creation path.
- Route generic "new event" actions to the guided creation flow, not a vertical-specific route.
- Create shared design tokens for color, radius, shadow, field, card, modal, and button styles.
- Separate visual rules by surface:
  - Marketing pages can be richer, but must stay performant.
  - Creation flows should be calm, warm, and simple.
  - Public event pages can be expressive, with consistent actions.
  - Admin tools can be denser and more utilitarian.
- Consolidate repeated category cards, source cards, action buttons, RSVP controls, and calendar pickers.
- Reduce global font and palette drift before adding new themes.
- Prefer local optimized images over remote decorative backgrounds.
- Normalize product language around "live card," "event page," "snap/upload," "RSVP," and "share."
