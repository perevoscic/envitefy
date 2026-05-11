# Envitefy Admin Dashboard Redesign Plan

## Scope Decision

This pass targets the internal platform admin route at `/admin`, implemented in `src/app/admin/page.tsx`.

The earlier creator-dashboard interpretation was incorrect for the screenshoted surface. The creator home dashboard work remains separate from this `/admin` rebuild.

## Current Problems

- The `/admin` route looked like a generic utility page instead of an Envitefy operations dashboard.
- The top action tiles repeated basic links with acronym badges and little hierarchy.
- Platform stats were visually flat and did not explain what each metric helps an admin inspect.
- The user search area dominated the page but felt disconnected from event and scan intelligence.
- There was no place for the future Concierge operations assistant.
- Mobile layout stacked the old cards, but the visual hierarchy still started with low-value shortcuts.

## Proposed Structure

1. Admin Header
   - Premium internal-admin hero with clear route purpose and primary admin shortcuts.

2. Admin Tool Cards
   - Campaigns, templates, and creative operations as cleaner action cards with icons and descriptions.

3. Admin Concierge Preview
   - Practical prompt chips for platform health, users with scans but no events, RSVP setup issues, ownership drift, and campaign audiences.

4. Platform Overview
   - Clickable, useful stat cards for users, scans, events, and shares.
   - Scan and event cards keep category breakdowns visible.

5. User Operations
   - Keep existing search, stat filters, debug event URLs, scan URLs, and delete workflow.
   - Restyle as the operational detail surface instead of a generic search card.

## Components To Change

- `src/app/admin/page.tsx`
  - Rebuild header, action cards, stats cards, Concierge panel, and user operations shell.
  - Preserve existing admin routes, stats API calls, user search, debug links, and delete behavior.

## Data Needed

Available now:

- `/api/admin/stats`: total users, total scans, total events, total shares, category breakdowns.
- `/api/admin/users`: searchable and sortable admin user list with scan/event totals and debug URL metadata.

Future backend fields:

- Event page views and unique visitors.
- RSVP setup and RSVP aggregate health by event.
- Creator lifecycle flags: scans with no event created, drafts not published, campaigns sent, share link usage.
- Admin activity feed.
- Audited Concierge recommendations and generated admin summaries.

## Mobile Layout Approach

- Stack header, action cards, Concierge, metrics, and user operations in a single-column flow.
- Use large tap targets and avoid tables on mobile by preserving the existing card-based user result view.
- Keep destructive user actions secondary and clearly styled.

## Desktop Layout Approach

- Use a wider, premium admin shell.
- Pair action cards with Concierge in a top operations band.
- Use a four-card metric grid before the detailed user operations panel.
- Preserve the desktop table for dense admin inspection.
