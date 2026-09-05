# Admin Content Studio — retired

Retired on September 5, 2026 at the user's request. Marketing video production uses the local `video-studio/` workflow.

The `/admin/marketing-images` page and its legacy subpage, dedicated `/api/admin/marketing-studio` routes, background worker, maintenance script, navigation entries, and Vercel reconciliation cron have been removed. Old `/admin/marketing-assets` and `/admin/marketing-campaigns` bookmarks redirect to `/admin`.

Historical database records, generated media, and the applied `20260904_add_admin_marketing_studio.sql` migration are retained. This retirement does not drop tables or delete stored assets.

The customer invitation editor at `/studio`, the separate `/admin/ad-studio`, and the local `video-studio/` project are separate features. Do not restore the retired Content Studio page or cron as a dependency of those workflows.
