# Envitefy monitoring and monetization audit

September 10, 2026. Static review of the current working tree, including existing local changes. No application code, production configuration, customer records, or campaigns were changed. Production analytics, affiliate approval/payouts, infrastructure dashboards, and provider invoices were not inspected. “Implemented” below means present in the code, not independently verified in production.

Envitefy already has substantial product functionality, an admin reporting foundation, and an affiliate revenue path. The best next investment is to connect existing usage to revenue and delivery cost, repair affiliate coverage, and test one paid event package. Actual demand and margins still need measurement.

## What is already implemented

| Area | Evidence | Assessment |
| --- | --- | --- |
| Website analytics | [PrivacyControls.tsx](/Users/rj/Local_Dev/envitefy/src/components/PrivacyControls.tsx:44), [GoogleAnalyticsRouteTracker.tsx](/Users/rj/Local_Dev/envitefy/src/components/GoogleAnalyticsRouteTracker.tsx:15), [GA4 reporting](/Users/rj/Local_Dev/envitefy/src/lib/admin/ga4-reporting.ts) | Consent-gated GA4 page views, Vercel Speed Insights, and admin GA4 reporting/configuration checks. Production connection and data completeness remain unverified. |
| Template journey | [TemplateEditorContext.tsx](/Users/rj/Local_Dev/envitefy/src/components/templates/TemplateEditorContext.tsx:328), [PublicTemplateGallery.tsx](/Users/rj/Local_Dev/envitefy/src/components/templates/PublicTemplateGallery.tsx:193) | Events cover gallery views, selection, editor views, first edits, save attempts, authentication completion, draft saves, and publishing. This is useful existing instrumentation to extend. |
| Guest engagement | [event-tracking-client.ts](/Users/rj/Local_Dev/envitefy/src/utils/event-tracking-client.ts:5), [tracking endpoint](/Users/rj/Local_Dev/envitefy/src/app/api/analytics/events/route.ts:31), [tracking storage](/Users/rj/Local_Dev/envitefy/src/lib/db.ts:316) | First-party event views, share actions, registry clicks, and other link clicks. Stores event identity, surface, destination, optional viewer identity, and a hashed visitor identifier. Browser tracking requires analytics consent. |
| Business activity | [admin overview](/Users/rj/Local_Dev/envitefy/src/lib/admin/overview.ts), [scan reporting](/Users/rj/Local_Dev/envitefy/src/lib/admin/scans.ts), [Concierge reporting](/Users/rj/Local_Dev/envitefy/src/lib/admin/concierge.ts) | User/event/share/RSVP counts, category summaries, recent activity, weekly comparisons, scan attempts versus saves, and saved creation-session states. |
| Reliability and recovery | [health endpoint](/Users/rj/Local_Dev/envitefy/src/app/api/health/route.ts:4), [admin health](/Users/rj/Local_Dev/envitefy/src/app/admin/health/page.tsx:8), [diagnostic worker](/Users/rj/Local_Dev/envitefy/src/lib/scan-diagnostic-worker.ts:12), [calendar recovery](/Users/rj/Local_Dev/envitefy/src/lib/calendar-sync-background.ts:32), [artwork recovery](/Users/rj/Local_Dev/envitefy/src/lib/ocr/scan-artwork.ts:40) | Basic liveness and database-table checks; durable scan preview jobs with leases/retries; saved calendar/artwork state and recovery paths. Recovery is useful but is not an alerting system. |
| AI operational data | [model telemetry](/Users/rj/Local_Dev/envitefy/src/lib/creation/openai-workloads.ts:18), [server timing](/Users/rj/Local_Dev/envitefy/src/lib/server-timing.ts), [artwork repair](/Users/rj/Local_Dev/envitefy/src/lib/studio/generate.ts:218) | Selected model calls log model, outcome, duration, and tokens. Some routes expose opt-in stage timing. Artwork generation limits automatic repair to one attempt. These are not a complete financial usage ledger. |
| Email campaigns | [audience filters](/Users/rj/Local_Dev/envitefy/src/lib/admin/email-campaigns.ts:1), [campaign sending](/Users/rj/Local_Dev/envitefy/src/lib/admin/email-campaign-send.ts:190) | Campaign creation/sending, audience filters by scan count and activity, and sent/failed totals. No end-to-end campaign-to-purchase reporting was found. |
| Affiliate monetization | [Amazon tagging](/Users/rj/Local_Dev/envitefy/src/lib/affiliate/amazon.ts:3), [affiliate configuration](/Users/rj/Local_Dev/envitefy/src/utils/affiliates.ts:133), [SponsoredSupplies](/Users/rj/Local_Dev/envitefy/src/components/SponsoredSupplies.tsx), [registry page](/Users/rj/Local_Dev/envitefy/src/app/registry/[id]/page.tsx) | Amazon tags are applied across several registry/rendering paths. Sponsored supplies and configurable Target/Oriental Trading URLs exist. Configuration hooks are not evidence of active partnerships or commissions. |
| Direct billing | [dependencies](/Users/rj/Local_Dev/envitefy/package.json), [current database schema](/Users/rj/Local_Dev/envitefy/prisma/manual_sql/init_db_pgcrypto.sql:4), [pricing support answer](/Users/rj/Local_Dev/envitefy/src/lib/guest-chat/knowledge.ts:129) | No active checkout, payment-provider webhook handler, purchase ledger, paid-plan entitlement enforcement, or billing portal was found in the reviewed application code. The chatbot explicitly has no confirmed pricing. |

The subscription-plan claims in [README_CAMPAIGNS.md](/Users/rj/Local_Dev/envitefy/README_CAMPAIGNS.md:10) are stale relative to the current audience-filter contract. A historical script protecting a `stripe_webhook_events` table also does not establish that a current payment integration exists. Apple calendar subscriptions are calendar feeds, not paid subscriptions.

## Gaps to fix first

### 1. Sponsored supplies has a likely production configuration defect

[The configuration helper](/Users/rj/Local_Dev/envitefy/src/utils/affiliates.ts:29) reads `process.env[key]` dynamically. `SponsoredSupplies` is a client component and waits until browser mount to render. Its enable flag uses that helper and defaults to false in production.

Next.js documents that dynamic environment-variable lookups are not inlined into browser bundles. Therefore, under the standard build behavior, setting `NEXT_PUBLIC_AFFILIATE_ENABLE` alone is likely insufficient to enable this block. Several other affiliate settings use the same helper. This is a source-based finding; the deployed bundle has not been reproduced. [Next.js environment-variable documentation](https://nextjs.org/docs/app/guides/environment-variables).

Use explicit public configuration references or pass a small validated configuration object from the server. Verify the actual production build. Amazon's separate direct `process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` access does not have this particular dynamic-lookup issue.

### 2. Shopping clicks do not equal tracked or earned revenue

[SponsoredSupplies](/Users/rj/Local_Dev/envitefy/src/components/SponsoredSupplies.tsx:89) and [standalone registry purchase buttons](/Users/rj/Local_Dev/envitefy/src/app/registry/[id]/page.tsx:97) use ordinary anchors without the shared interaction tracker. Other registry surfaces do use `EventTrackedLink`, so coverage is mixed.

Add consistent impression and click measurement by placement, merchant, and nonsensitive event category. Keep partner-supported attribution identifiers separate from visitor identity. Reconcile merchant reports for actual qualifying orders, reversals, and paid commissions; never treat a registry claim or outbound click as a verified purchase.

Sponsored supplies has a Sponsored label, but several tagged registry surfaces do not show a nearby affiliate explanation in their component. Standardize disclosure with the actual merchant arrangement. Amazon specifies both link-level disclosure and site identification as an Associate. [Amazon disclosure guidance](https://affiliate-program.amazon.com/help/node/topic/GHQNZAU6669EZS98).

### 3. The admin funnel is not a conversion funnel

[The overview funnel](/Users/rj/Local_Dev/envitefy/src/lib/admin/overview.ts:377) puts totals for users, events, public events, shares, and RSVPs in sequence. Those are different units, with multiple events/shares/guests per person. Dividing adjacent totals cannot establish a conversion rate. [The tracking-gap list](/Users/rj/Local_Dev/envitefy/src/lib/admin/analytics.ts:100) already marks creation-to-publish attribution as partial; its availability labels are static declarations rather than a runtime tracking audit.

Track the same creator or anonymous creation session through started → useful preview → explicit save → publish → upgrade offered → checkout → confirmed payment. Link the preview to a saved event only when the user explicitly saves. Do not create drafts to make analytics easier. Keep guest engagement and creator conversion as separate funnels, and preserve the existing consent choice.

Report separate cohorts for Snap, Concierge, templates, and sign-up forms, plus event category and acquisition source. Template events already provide a head start. Payment success must come from a verified provider event, not a browser success-page visit.

### 4. AI spending is not attributed to customers or purchases

Current model telemetry is console output with no durable user/event cost ledger. Time and token limits exist, but they do not establish margin. Include text, image generation, verification, automatic repairs, scans, discovery, and failed attempts; failed and abandoned creations still cost money. Saved scan personalization also generates both background and hero artwork, so counting saved events alone underestimates image work.

Add a usage ledger with operation ID, user or anonymous budget key, optional saved-event ID, feature, provider/model, measured units, result, retries, duration, and a versioned estimated cost. Reconcile estimates with provider invoices. Enforce atomic budgets across server instances before billable work; reserve usage before generation and settle afterward so concurrent requests cannot overspend an allowance.

The reviewed [OCR handler](/Users/rj/Local_Dev/envitefy/src/lib/ocr/pipeline.ts:2004) resolves the session late, after expensive processing; API routes are excluded from the [middleware matcher](/Users/rj/Local_Dev/envitefy/src/middleware.ts:427). No shared preflight spend allowance was found there. The [image-generation route](/Users/rj/Local_Dev/envitefy/src/app/api/studio/generate/route.ts:44) authenticates but has no visible paid entitlement or per-user budget check. External infrastructure protections remain unknown. Preserve guest trial access through a bounded allowance instead of accidentally offering unbounded provider work.

### 5. Operational monitoring needs proactive failure detection

`/api/health` returns 200 without checking dependencies. `/admin/health` checks table existence. [instrumentation.ts](/Users/rj/Local_Dev/envitefy/instrumentation.ts:1) is a no-op, and no integrated central error-monitoring SDK or outbound operational alert pipeline was found. Deployment-level monitoring could exist separately.

Keep the lightweight liveness endpoint; add a separate readiness check and an external uptime check. Monitor errors and latency for scan, generate, save, publish, RSVP, and calendar sync, with operation IDs and release identifiers. Add alerts for aged pending work, failed work, exhausted diagnostic retries, missing worker check-ins, and spend anomalies. The [daily diagnostic cron](/Users/rj/Local_Dev/envitefy/vercel.json:2) drains up to five jobs per invocation, with additional processing after successful scans; measure backlog age before choosing worker frequency.

Record OCR started/failed/completed outcomes as operational metadata. The current durable scan accounting is primarily written after completed processing, so it is not a complete failure-rate denominator. Prefer low-volume, actionable alerts with minimum sample sizes, not a notification for every transient provider error.

### 6. Marketing activity is not yet tied to commercial results

Campaign sent/failed counts describe dispatch, not delivery, activation, or purchase. Add recipient delivery/bounce/complaint feedback where supported, campaign attribution, and creator outcomes. Use the existing campaign system for a small pricing pilot once authorized; no outreach was sent during this review. Any draft-resumption messages must refer only to explicitly saved progress and respect communication preferences.

## Revenue experiments worth prioritizing

These are proposed US-dollar tests, not validated willingness to pay or current product prices.

| Priority | Offer | Starting test | Reuse and required work |
| --- | --- | --- | --- |
| 1 | Improve existing affiliate shopping | Partner commissions; no user charge | Repair configuration, track eligible nonmedical shopping placements, verify partner accounts/tags, improve relevant gift/supply recommendations, and reconcile actual earnings. Fastest existing revenue path to evaluate, but traffic and qualifying purchases determine returns. |
| 2 | Premium event package | $19 per new event; test against $12/$29 when sample size allows | Build around existing Concierge artwork, invitation exports, live event pages, and guest coordination. Define a finite artwork allowance and a clear premium benefit such as removing promotional attribution. Add pricing, checkout, entitlements, and cost controls. Offer a bounded preview with the price disclosed before substantial work. Preserve existing published events and original-file access. |
| 3 | Organizer subscription | $29/month pilot | Target repeat hosts such as clubs, schools, churches, and planners. Reuse sign-up forms, sports schedules, RSVPs, and event dashboards. Shared organization roles, reusable rosters, brand settings, and cross-event reporting would be new work; validate demand with a few paying pilot organizations before building all of it. |
| 4 | Assisted event setup | $99 per event, tightly scoped | Use existing builders to prepare a finished invitation/site for a customer who wants help. Define deliverables and revision limits. Manual production/support time must be included in margin. This can test willingness to pay before a large subscription build. |

The [product catalog](/Users/rj/Local_Dev/envitefy/src/lib/product-marketing-catalog.ts) documents the existing product foundation: Concierge, hosted pages, printable/digital invitations, guest coordination, smart sign-ups, and specialist sports/wedding experiences. Keep proposed features out of that catalog until launched and verified.

For context, Evite lists single-event Premium packages starting at $17.99 for up to 12 guests and Pro at $249.99/year. Paperless Post offers both per-event pricing and annual subscriptions. SignUpGenius distinguishes free participation/basic creation from paid organizer capabilities. Those support testing an occasional-host purchase and a separate repeat-organizer plan, but do not prove that Envitefy users will buy either. [Evite pricing](https://support.evite.com/premium/what-is-premium/premium-pricing), [Paperless Post pricing](https://www.paperlesspost.com/pricing), [SignUpGenius account options](https://support.signupgenius.com/hc/en-us/articles/29465953836183-Is-SignUpGenius-Free).

Keep guest viewing, basic replies, and calendar actions easy to use. Avoid launching unlimited AI usage before costs are measured. Paid ticketing, organizer payouts, a vendor marketplace, and broad display advertising would add substantial work or require scale; defer them until the simpler offers produce evidence.

## Smallest useful implementation sequence

1. **Verify and measure:** Check live GA4 ingestion, affiliate configuration, and current deployment monitoring; repair affiliate configuration/tracking; create the usage ledger and creator funnel; add external liveness/readiness and actionable error alerts. Do not infer that unconfigured analytics means zero usage.
2. **Launch one purchase:** Add a pricing page and one event package using hosted checkout, a verified idempotent webhook, purchase records, server-enforced event entitlements, and a clear generation allowance. Handle failed/delayed payments, duplicate callbacks, refunds, and cancellation without losing saved work. Stripe's hosted Checkout supports both one-time and subscription purchases. [Stripe Checkout](https://docs.stripe.com/payments/checkout).
3. **Run a small sales pilot:** Recruit a small set of eligible hosts or organizations with explicit outreach authorization. Measure paid purchase, finished-event delivery, support effort, repeat use, and refunds. Record customer reasons for declining. Add an organizer subscription only when repeat usage supports it.
4. **Expand what earns:** Improve the highest-converting creation flow and the affiliate placements with verified earnings. Add new features based on pilot feedback rather than expanding every vertical simultaneously.

## The dashboard that would help make money

| Metric | Decision it supports |
| --- | --- |
| Eligible creators → useful preview → published event → purchase, by cohort | Where people stop and which workflow deserves investment |
| Price offer → checkout → confirmed purchase | Whether customers value the package and whether checkout works |
| Net product revenue and verified affiliate commissions | What the business actually earned; distinguish pending commissions |
| AI/media/email variable cost, including failed and abandoned attempts | Whether free use and paid allowances are affordable |
| Contribution per event/customer/cohort | Which products are profitable before fixed overhead |
| Repeat hosting and subscription retention, once applicable | Whether recurring plans fit actual behavior |
| Critical-flow success, latency, backlog age, and exhausted retries | Where reliability is losing customers or increasing support costs |

Contribution = collected product revenue − refunds − payment fees − variable AI/media/email costs − attributable fulfillment/support costs. Keep affiliate commissions separate until verified, then include them explicitly. For example, 100 purchases at $19 produce $1,900 gross product revenue, not $1,900 profit. This is arithmetic, not a revenue forecast.

Because Envitefy handles medical scans, keep document text, names, contact details, and identifying URLs out of third-party analytics and error payloads. The current GA route tracker sends `document.title` and the raw path, so add route-based redaction or exclusion before expanding telemetry on sensitive event pages. Store only the operational metadata needed for budgets and reliability, keep optional behavioral analytics consent-gated, and do not use private scan contents for affiliate targeting.

Validation for this audit was source inspection and official documentation checks. No runtime test suite was run because no executable code changed. Production readiness, demand, cost estimates, and partner earnings need live verification before commercial claims are made.
