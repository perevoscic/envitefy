# Creation chat retirement

The signed-in conversational event creator is retired. Its sidebar list, thread and intake APIs, owner conversational assistant, and admin chat metrics are removed. `/chat`, including saved thread bookmarks, redirects to `/` without forwarding stale query parameters.

Creation links now open the guided Live Card builder, matching Event Page category editor, or Snap. Saved events continue to use their owner workspaces and current editors. The separate Sign-up Form workflow stays available. No database tables, conversation records, events, artwork or guest activity are deleted.

The signed-out help chat remains available as **Envitefy Concierge**, with **Concierge** in navigation. It answers questions about Envitefy and points visitors to the appropriate builder. It does not create, modify, save or publish events. Public help answers, product catalog, guides and email creation links describe the current workflows.

On desktop, its bottom-right launcher is hidden while the hero is visible. It slides in from the right when the hero leaves the viewport and back out when the hero returns, using the existing mobile navigation observer. The question panel opens in the same corner, and reduced motion disables sliding. Phones keep their existing bottom navigation and chat sheet. `npm run test:concierge` verifies the scroll threshold, both slide directions, keyboard focus, mock Help submission, mobile layout and reduced motion.

Utilities under `src/lib/concierge` that remain imported by current scans, public event renderers, artwork generation, help or asset tools stay in place. The asset store only initializes asset storage; it no longer initializes conversation or creation-session tables. Admin health checks and local campaign fixture counts no longer query those retired tables.

Verification uses the sidebar and middleware regressions, customer entrypoints, `npm run typecheck`, `npm run test:create-remediation`, and `npm run test:create-browser`. Local audit and verification outputs belong in `output/`.

October 3 verification: application typecheck passed, 748 creation regression tests passed, 8 browser tests passed, and 24 customer entrypoint tests passed. The focused retirement, Help, manual-save, scan and saved-card checks passed after deletion. Biome passed for the checked changes. VS Code diagnostics were unavailable because the Chat to CLI linter bridge was missing.
