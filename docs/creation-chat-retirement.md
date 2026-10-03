# Creation chat retirement

The signed-in conversational event creator is retired. Its sidebar list, thread and intake APIs, owner conversational assistant, and admin chat metrics are removed. `/chat`, including saved thread bookmarks, redirects to `/` without forwarding stale query parameters.

Creation links now open the guided Live Card builder, matching Event Page category editor, or Snap. Saved events continue to use their owner workspaces and current editors. The separate Sign-up Form workflow stays available. No database tables, conversation records, events, artwork or guest activity are deleted.

The signed-out help chat remains available as **Help**. It answers questions about Envitefy and points visitors to the appropriate builder. It does not create, modify, save or publish events. Public help answers, product catalog, guides and email creation links describe the current workflows.

Utilities under `src/lib/concierge` that remain imported by current scans, public event renderers, artwork generation, help or asset tools stay in place. The asset store only initializes asset storage; it no longer initializes conversation or creation-session tables.

Verification uses the sidebar and middleware regressions, customer entrypoints, `npm run typecheck`, `npm run test:create-remediation`, and `npm run test:create-browser`. Local audit and verification outputs belong in `output/`.
