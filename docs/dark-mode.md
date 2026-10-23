# Application and email appearance

The application offers a small sliding sun/moon **Light / Dark** switch in
Settings, navigation menus and headers. Its visible track is 56 by 28 pixels,
inside a 44-pixel-high touch target. It has a soft top shadow and a lavender glow
in dark appearance. Colors and shadows use the application theme tokens.
New browsers automatically follow device appearance through the internal `system`
preference, without a separate System or Device control. The switch reflects the
resolved appearance; toggling it selects an explicit light or dark preference.
Keyboard activation and reduced motion remain supported.
Account menus place the switch on the left and Log out on the right in two equal
columns in the bottom row, without a visible Appearance label. Accessible switch
and group names remain.
The browser preference is stored as `envitefy:appearance:v1`; it is not an account
setting and does not modify event records. Explicit choices override device
changes; browsers without an override respond to device changes. Other tabs synchronize through
the storage event. Restricted storage falls back to the current tab's memory.

## Palette and ownership

`src/themes/registry.ts` is the source of application semantic colors. The initial
bootstrap and the React provider consume the same registry. CSS modules and
Tailwind semantic utilities consume those roles rather than a separate palette.
The root layout imports both shared navigation and switch CSS modules directly.
Their styles must arrive with the persistent layout stylesheet instead of relying
on the dynamically loaded sidebar's CSS chunk. Isolated Bun fixtures cannot
verify that Next stylesheet-delivery path; the navigation suite also compiles
through Next's CSS loaders and extraction plugin, and guards the root imports.

| Role | Dark color |
| --- | --- |
| Canvas | `#181818` |
| Panel | `#251F2D` |
| Field / secondary surface | `#302738` |
| Raised surface | `#382D42` |
| Text / secondary text | `#F2EAFA` / `#C0B3D0` |
| Navigation text and icons / secondary navigation text | `#F2C6DE` / `#CDB5C8` |
| Placeholder | `#B2A4C1` |
| Decorative border / input boundary | `#51435F` / `#857294` |
| Primary / hover / pressed | `#C5A7FF` / `#D3BAFF` / `#B590F2` |
| Primary text | `#25103E` |
| Success / warning / error / info | `#80D8B3` / `#F2C879` / `#FFA7B5` / `#90C7F4` |

Header gradients blend plum `#462F4D` and blue `#233A4E`, fading into `#211B2A`.
Sidebars, mobile drawers and navbar menus use opaque plum surfaces. Menu labels
and icons use light pink, with raised plum selected/hover states and lavender
keyboard focus. Event-page frost rules apply only in light appearance; changing
the event's palette cannot turn application navigation pale in dark appearance.
Native browser bars use a solid `#181818` in dark application views. Event-owned
browser colors retain their existing registration/disposal lifecycle.

The login transition uses a plum background with pink and lavender light, a raised
plum wordmark panel and white shimmering lettering in dark appearance. The light
transition keeps its existing lavender wash. Both respect reduced motion.

`data-appearance-scope="authored"` protects gallery artwork, event pages, sign-up
designs and Live Card artwork. Application dark utility compatibility selectors
and the Tailwind dark variant exclude this boundary. The event's own palette,
artwork pixels, fonts, exports and explicit save behavior remain independent.
Shared application dialogs use an application scope even when opened from an
authored design. Theme changes must not remount editors or request artwork.

## White branding

The canonical wordmark joins the v–i and f–y serif edges just enough to touch,
without overlapping their letter bodies. Every current app placement, new email,
ad and export uses the shared component or `ENVITEFY_BRAND_ASSETS` registry.
Wordmark images are rendered from the same component and bundled font under
`brand/wordmark-v2`; email GIF derivatives under `email/wordmark-v2` support inboxes
without WebP. Prepared app logos load directly, bypassing the Next image optimizer.
Approved white emblem and Instagram/Facebook/YouTube/TikTok/Reddit assets retain
their versioned URLs under `brand/white-v1` and `email/white-v1`. Original URLs remain
unchanged because delivered email and ad renders still reference them. Email
matte variants use `#251F2D` behind the white glyphs. Light application views and
authored event branding keep their existing readable variants. Other companies'
logos and organizer artwork are not recolored.

## Adaptive email and campaign compatibility

Email appearance follows inbox capabilities, independently of the website
preference. The fallback body is light; supporting inboxes use the dark palette.
Both appearances retain dark branding bands and white logo/wordmark/social marks.
Email helpers output inline fallback colors and supported dark overrides, not
browser CSS variables. Unsupported clients retain a readable fallback.

New transactional messages and newly composed campaigns use `adaptive-v1`.
Persisted campaigns with absent design metadata are legacy: saving, sending,
retrying or scheduling them must not silently upgrade their appearance. Version
metadata uses the existing campaign JSON store, without a new database column.
Old remote asset paths and sent HTML are preserved. Sender/recipient rules,
transports, private links, selected sign-up slots, unsubscribe behavior and
plaintext content are independent of appearance.

Reusing an old campaign creates a new adaptive composition and leaves the original
campaign intact; editing that original ID continues to use its stored design.

## Verification

Run `npm run test:appearance` for the application preference/first-paint browser
suite, actual signed-in sidebar/navbar coverage and white-asset checks. Navigation
coverage includes expanded/collapsed rails, category submenus, account menus and
mobile drawers over both app backgrounds and dark event pages. Run
`npm run test:email-appearance` for email/version
and rendering coverage. Generated previews and screenshots belong in ignored
`output/` directories. Feature regressions also cover creation, editors, signup,
co-hosts, calendars, mobile navigation and Concierge.

Browser email emulation verifies generated HTML and CSS, not Gmail/Outlook/Apple
Mail's proprietary rendering. Record real-client checks separately. Native iOS
project validation runs on Windows; Swift compilation and device rendering
require macOS/Xcode.

The exploratory `src/components/EventOwnerView.test.mjs` run has three failures
also reproduced against the unchanged HEAD source/dependencies: an obsolete
`Event actions` label expectation, a legacy `Card artwork` expectation, and an
undefined mocked artwork-preview component. The event-editor and full Live Card
browser suites pass independently.
