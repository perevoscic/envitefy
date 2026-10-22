# Admin Ad Studio — retired

Retired on October 22, 2026 at the user's request.

The `/admin/ad-studio` dashboard, its components and server actions, the four `/api/admin/ad-studio` handlers, and the dedicated `src/lib/admin/ad-studio` pipeline and compatibility wrappers have been removed. Admin navigation no longer offers Ad Studio. Its dedicated tests, active mobile route inventory entry, and README environment example have been removed or updated.

Old `/admin/ad-studio` bookmarks redirect to `/admin` through `next.config.ts`. The removed API endpoints return 404; they no longer generate campaigns, images, video prompt packages, or serve run assets.

Historical runs and exports under `qa-artifacts/ad-studio-runs` are retained. This retirement does not delete stored media, remove database records, or drop tables.

Live Cards at `/live-cards`, the legacy `/studio` redirects, invitation services under `/api/studio` and `src/lib/studio`, the independent `/api/admin/marketing-campaigns` workflow, and the local `video-studio/` project are retained. The existing `/admin/marketing-campaigns` bookmark still redirects to `/admin`. Shared OpenAI utilities, brand assets, image and media dependencies, and admin authorization remain available to those workflows.

The older [Admin Content Studio retirement](admin-content-studio.md) remains separate. Neither retired studio is a dependency of the retained creation or marketing workflows.
