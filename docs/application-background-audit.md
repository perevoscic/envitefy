# Application background audit

Audited October 29, 2026. This is a repository audit of route components and shared CSS, not a verification of the deployed production pages. The links below identify the production routes for review; opening a link does not establish that these local changes have been deployed. Account, admin, event-access and feature-grant requirements still apply.

The dashboard's light/dark aurora is the default application canvas. `MainContentWrapper` supplies `GradientBackgroundLayer` by default, including new routes and signed-out utility pages. A page must have an explicit design reason to cover that canvas. Cards, fields, dialogs, editor preview artwork and authored invitations retain their own surfaces.

The latest follow-up excludes Settings, which is complete, and Create (`/create` and `/envitefy-create`). The remaining ordinary page canvases below now use the shared background; authored invitation and email-preview contents retain their design.

## Earlier application-page corrections

| Page | Review link | Previous override |
| --- | --- | --- |
| Settings, including every settings section | [Settings](https://envitefy.com/settings) | The settings canvas painted a flat light/dark background. |
| My Events and its filtered views | [My Events](https://envitefy.com/events) | The workspace painted a flat lavender background. |
| Create | [Create](https://envitefy.com/create) | The legacy fallback painted a flat lavender background; the current unified workspace already uses a transparent canvas. |
| Add to calendar | [Calendar handoff](https://envitefy.com/calendar/add) | The handoff painted a flat background and the app shell disabled the shared gradient. A complete event handoff needs its existing query parameters. |
| Co-host invitation | [Co-host invitation](https://envitefy.com/cohost-invite) | The invitation utility painted a slate background and the app shell disabled the shared gradient. A real invitation needs its existing invitation parameters. |
| Forgot password | [Forgot password](https://envitefy.com/forgot) | The utility painted a solid light background and a separate solid dark background. |
| Reset password | [Reset password](https://envitefy.com/reset) | The utility painted a solid background. A real reset needs its existing token. |
| Unsubscribe | [Unsubscribe](https://envitefy.com/unsubscribe) | The utility painted a paper background and a separate solid dark background. A real unsubscribe needs its existing parameters. |
| Event registries | Dynamic route patterns: `/registry/{id}` and `/event/weddings/{id}/registry` | Both registry wrappers painted slate. No saved-event ID was invented for this audit. |

Editor loading/error screens also inherit the canvas: [Appointments](https://envitefy.com/event/appointments/customize), [General](https://envitefy.com/event/general/customize), [Workshops](https://envitefy.com/event/workshops/customize), [Special events](https://envitefy.com/event/special-events/customize), [Birthdays](https://envitefy.com/event/birthdays/customize), [Cheerleading](https://envitefy.com/event/cheerleading/customize), [Football season](https://envitefy.com/event/football-season/customize) and [Soccer](https://envitefy.com/event/soccer/customize). The [Gymnastics demo workspace](https://envitefy.com/event/gymnastics/customize?demo=1) has a transparent outer canvas; its authored preview retains its own design.

The sign-up unavailable, sign-in and invitee-access screens at `/smart-signup-form/{id}` also use the shared canvas; successful form views retain the authored design.

Sports loading, access and preference-setup screens at [Gymnastics](https://envitefy.com/event/gymnastics) and [Sports](https://envitefy.com/event/sport-events), and custom Event Page loading/error screens at [Design editor](https://envitefy.com/event/design/customize), also inherit the shared canvas. The selected gallery or authored preview that follows retains its specified background.

The shared shell's admin exclusion has also been removed. These admin routes now receive the default canvas unless an explicit preview design covers it:

- [Admin](https://envitefy.com/admin), [Analytics](https://envitefy.com/admin/analytics), [Campaigns](https://envitefy.com/admin/campaigns), [Creation access](https://envitefy.com/admin/creation-access).
- [Events](https://envitefy.com/admin/events), [Health](https://envitefy.com/admin/health), [Marketing assets](https://envitefy.com/admin/marketing-assets), [Marketing campaigns](https://envitefy.com/admin/marketing-campaigns).
- [Scans](https://envitefy.com/admin/scans), [Settings](https://envitefy.com/admin/settings), [Users](https://envitefy.com/admin/users), [Emails](https://envitefy.com/admin/emails). Scan details use `/admin/scans/{id}`.

## Remaining page canvases updated in the follow-up

The category-gallery, public marketing and admin-tool canvas exceptions have been removed. Each route is listed for review below; these local changes have not been deployed.

### Category galleries

Native and public template-gallery page wrappers, header canvases, filter surrounds and safe areas inherit the dashboard aurora. Category-specific template artwork and content colors remain scoped to their cards and previews. This replaces the former category tint on the page, navigation and safe areas.

- Native galleries: [Birthdays](https://envitefy.com/event/birthdays), [Weddings](https://envitefy.com/event/weddings), [Gymnastics](https://envitefy.com/event/gymnastics), [Football](https://envitefy.com/event/football), [Anniversaries](https://envitefy.com/event/anniversaries), [Baby showers](https://envitefy.com/event/baby-showers), [Gender reveal](https://envitefy.com/event/gender-reveal), [Sports](https://envitefy.com/event/sport-events), [General events](https://envitefy.com/event/general).
- Collections use the same General gallery: [School & classroom](https://envitefy.com/event/general?collection=school) and [Holidays & seasonal](https://envitefy.com/event/general?collection=holidays-seasonal). `/event/school` redirects to the School collection.
- Sports selections use the shared canvas: [Football](https://envitefy.com/event/sport-events?sport=football), [Soccer](https://envitefy.com/event/sport-events?sport=soccer), [Cheerleading](https://envitefy.com/event/sport-events?sport=cheerleading), [Dance](https://envitefy.com/event/sport-events?sport=dance).
- Public template galleries: [Birthdays](https://envitefy.com/birthdays/templates), [Weddings](https://envitefy.com/weddings/templates), [Gymnastics](https://envitefy.com/gymnastics/templates), [Football](https://envitefy.com/football/templates), [Anniversaries](https://envitefy.com/anniversaries/templates), [Baby showers](https://envitefy.com/baby-showers/templates), [Bridal showers](https://envitefy.com/bridal-showers/templates), [Gender reveal](https://envitefy.com/gender-reveal/templates), [Sports](https://envitefy.com/sport-events/templates), [Sign-up forms](https://envitefy.com/signup-forms/templates). [Sports alias](https://envitefy.com/sports/templates) resolves through the same Sports template category.

### Authored content preserved

Saved public designs retain their authored colors, artwork and backgrounds. Editor preview panes retain the corresponding design canvas. Their dynamic route patterns are `/event/{id-or-slug}`, `/e/{slug}`, `/card/{id}`, `/smart-signup-form/{id}` and the template/customize routes. These patterns are not usable sample links without an existing record.

The repository contains real static showcase slugs, which provide direct examples without using private saved-event IDs:

- [Lara's 7th Dino-Quest](https://envitefy.com/showcase/lara-s-7th-dino-quest), [Friday Night Lights A](https://envitefy.com/showcase/friday-night-lights-a), [Garden Vows](https://envitefy.com/showcase/garden-vows).
- [Madeline's Garden Brunch](https://envitefy.com/showcase/madeline-s-garden-brunch), [Elena's Beary Sweet Shower](https://envitefy.com/showcase/elena-s-beary-sweet-shower), [Lincoln Memorial Discovery Day](https://envitefy.com/showcase/lincoln-memorial-discovery-day).
- [The Carter Housewarming](https://envitefy.com/showcase/the-carter-housewarming), [Founder Appreciation Night](https://envitefy.com/showcase/founder-appreciation-night), [Lara's Dino-Quest](https://envitefy.com/showcase/lara-s-dino-quest).
- [Friday Night Lights B](https://envitefy.com/showcase/friday-night-lights-b), [Garden Candlelight](https://envitefy.com/showcase/garden-candlelight), [Blush Brunch Shower](https://envitefy.com/showcase/blush-brunch-shower), [Elena's Baby Shower](https://envitefy.com/showcase/elena-s-baby-shower).

Source: `src/components/landing/landing-live-card-snapshots.ts` and `src/app/showcase/[slug]/page.tsx`.

### Public marketing and information pages

Public marketing and information pages expose the same application canvas through their ordinary page and section wrappers. Category photography, authored samples, cards and control surfaces keep their own design. Envitefy Create is explicitly excluded and retains its existing editorial canvas.

- [Public homepage](https://envitefy.com/landing) (also the signed-out [root page](https://envitefy.com/)), [Invitation maker](https://envitefy.com/invitation-maker), [Snap](https://envitefy.com/snap), including signed-out browsing. [Envitefy Create](https://envitefy.com/envitefy-create) is excluded. `/envitefy-concierge` redirects to `/envitefy-create`; `/studio` and `/chat` are legacy redirect routes rather than separate backgrounds.
- [Gymnastics](https://envitefy.com/gymnastics), [Football](https://envitefy.com/football), [Sports](https://envitefy.com/sport-events) and its [alias](https://envitefy.com/sports), [Weddings](https://envitefy.com/weddings), [Birthdays](https://envitefy.com/birthdays), [Anniversaries](https://envitefy.com/anniversaries), [Baby showers](https://envitefy.com/baby-showers), [Bridal showers](https://envitefy.com/bridal-showers), [Gender reveal](https://envitefy.com/gender-reveal), [Sign-up forms](https://envitefy.com/signup-forms).
- [About](https://envitefy.com/about), [How it works](https://envitefy.com/how-it-works), [Who it's for](https://envitefy.com/who-its-for), [FAQ](https://envitefy.com/faq), [Contact](https://envitefy.com/contact), [Privacy](https://envitefy.com/privacy), [Terms](https://envitefy.com/terms), [Delete account](https://envitefy.com/delete-account), [Showcase index](https://envitefy.com/showcase).
- [Guides index](https://envitefy.com/guides), [Birthday RSVP invitation](https://envitefy.com/guides/birthday-rsvp-invitation), [Flyer to Event Page](https://envitefy.com/guides/flyer-to-event-page), [Gymnastics meet page](https://envitefy.com/guides/gymnastics-meet-page), [Live Card invitations](https://envitefy.com/guides/live-card-invitations), [PDF to Event Page](https://envitefy.com/guides/pdf-to-event-page), [Registry invitation page](https://envitefy.com/guides/registry-invitation-page), [RSVP Event Page](https://envitefy.com/guides/rsvp-event-page), [Share without an app](https://envitefy.com/guides/share-event-page-without-app), [Smart sign-up forms](https://envitefy.com/guides/smart-signup-forms), [Wedding Event Page](https://envitefy.com/guides/wedding-event-page).

Authentication utility pages `/forgot` and `/reset` now inherit the shared canvas. The authentication dialogs keep their own dialog surfaces. [Verify request](https://envitefy.com/verify-request) and [Mobile sign-in](https://envitefy.com/mobile/sign-in) do not declare an independent full-page background.

The signed-in [Live Cards introduction](https://envitefy.com/live-cards) uses a bounded, rounded editorial panel (`livecard-intro.module.css`) over the shared application background. Its builder and authored card previews are separate views reached from this route.

### Admin preview tools

The six email tools use the shared canvas around their preview frames. Rendered email contents retain their inbox design. The landing-preview access screen also inherits the default; the full landing mock remains an authored preview.

- [Landing preview](https://envitefy.com/admin/landing-preview).
- [Email editor](https://envitefy.com/admin/emails/editor), [Event-share email](https://envitefy.com/admin/emails/event-share), [Feature email](https://envitefy.com/admin/emails/features), [Magazine email](https://envitefy.com/admin/emails/magazine), [Password-changed email](https://envitefy.com/admin/emails/password-changed), [Password-reset email](https://envitefy.com/admin/emails/password-reset).

## Verification scope

The inventory follows route definitions and shared background selectors. It does not assert that every permitted category, every saved design or every deployed production route has been visually exercised. Dynamic records and account-specific permissions were not fetched for this audit. Browser verification results belong to the implementation task's validation report.

Earlier validation: Settings browser suite passed 23 tests, including 1280px/375px light/dark rendering, transparent Settings wrappers, continuous fixed aurora after scrolling, default shell behavior for admin and anonymous utility routes, and retained event/card shell exceptions. The admin/anonymous assertions exercise the real shell with fixture content, not each route's full content. Event-editor navigation and authored-paper regressions, runtime CSS parity, Settings/dashboard checks and application typecheck also passed.

Follow-up validation passed: application typecheck; 15 tests across the five template-gallery browser suites; all ten category pages at desktop/phone widths in light/dark appearance, including explicit transparent-canvas and fixed-aurora checks; the editorial-hero browser matrix; email, navigation, runtime CSS parity and authored-page regressions. Existing Sports workflow source assertions were updated to the current approved hero, catalog and routing structure and now pass; the inspected Sports landing, Football route and middleware product implementations were unchanged.

Actual local Next delivery passed 32 settled page/background cases: About, homepage, Birthday gallery, Wedding gallery and Forgot password at 1440px/390px in both themes; the four-mode excluded Create presentation; and desktop-light/phone-dark samples of Snap, Gymnastics, Baby showers and Sign-up forms. These checks found no page errors or horizontal overflow. Screenshots waited for visible content, fonts, motion and available viewport images. The Wedding gallery's external Unsplash photograph was deliberately blocked by the verifier's local-only network policy and remains visually unverified in that run; its shared canvas and local invitation samples passed. No deployed production page was tested or changed.
