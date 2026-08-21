# Envitefy SEO + AI Search Audit

Audit date: August 20, 2026

## Executive summary

Envitefy is indexable. Google can find the homepage, category pages, guides, showcase pages, and public examples. The main visibility problem is not a blanket indexing failure: the site did not have a page whose primary job was to satisfy the transactional query “create an invite,” while the sites ranking for that query use dedicated invitation-maker pages and have much stronger domain authority.

This pass adds that missing search-intent page and fixes several technical signals. It cannot by itself put a newer domain on page one for a head term dominated by established design platforms. The remaining growth lever is authority: real usage proof, original content, relevant referring domains, and time.

## What was fixed in this pass

- Added `/invitation-maker`, a focused, indexable page for “create an invite,” “online invitation maker,” and “invitation maker with RSVP.”
- Added answer-first copy, visible workflow steps, invitation examples, FAQs, internal category links, and valid `WebPage`, `WebApplication`, `BreadcrumbList`, and `FAQPage` JSON-LD.
- Changed the homepage title, description, and stable H1 to clearly describe online invitation creation.
- Kept the homepage H1 stable when the visual hero carousel rotates.
- Added the invitation-maker route to the sitemap, public middleware routes, mobile navigation, marketing footer, and `llms.txt`.
- Removed false `lastModified` values that changed with server/build execution instead of real page edits.
- Consolidated internal marketing links on the canonical `/` URL instead of sending authority to `/landing`.
- Removed a duplicate `public/robots.txt` that conflicted with `src/app/robots.ts` and caused a local `/robots.txt` 500.
- Limited crawler access to internal API, admin, settings, calendar, event-management, and concierge-management surfaces without blocking public events or AI/search crawlers.
- Corrected the global entity graph: stable `@id` values, a real logo asset, valid publisher references, and removal of a misleading Google-site-search `SearchAction`.
- Made About-page metrics available in server-rendered HTML instead of exposing zeros to non-JavaScript crawlers.
- Marked decorative repeated testimonial and metric marquees as hidden from accessibility/semantic extraction.

## Validation completed

- All 32 sampled public marketing, guide, category, and showcase URLs returned HTTP 200 locally.
- `/robots.txt` returns HTTP 200 from one authoritative Next metadata route.
- `/sitemap.xml` returns HTTP 200, contains `/invitation-maker`, and no longer emits inaccurate `<lastmod>` values.
- The invitation-maker page has one H1, one canonical URL, a unique title and description, valid JSON-LD, visible FAQ content, and no missing image alt text.
- The homepage H1 remained unchanged after a full hero rotation.
- Mobile-first check at 390 × 844 found no horizontal overflow; the H1 and primary CTA remain visible.
- Targeted regression tests: 12 passed.
- Biome and the repository VS Code diagnostics wrapper reported no issues in touched SEO files.
- The repository-wide TypeScript check remains red because of many pre-existing errors outside this SEO work; no reported error points to the new invitation-maker page.

## Open issues and risks

### 1. `www.envitefy.com` is not healthy

The HTTPS request to `www.envitefy.com` failed certificate/connection checks. Middleware already contains a 301 redirect, but TLS must succeed before that code can run. Fix this in DNS and the hosting provider:

1. Add `www.envitefy.com` to the same Vercel project as the apex domain.
2. Add the exact DNS record Vercel requests, normally a `www` CNAME.
3. Wait for Vercel to issue the certificate.
4. Keep the permanent redirect from `www` to `https://envitefy.com`.
5. Verify both HTTP and HTTPS variants redirect in one hop.

### 2. The marketing shell is not cacheable

The live homepage response includes `private, no-cache, no-store` because the root layout resolves the user session for every route. Local initial HTML was about 208 KB; the focused invitation-maker page was about 170 KB. Development-mode TTFB is not a production benchmark, but the live no-store header is real.

Recommended follow-up: move session-dependent app chrome below a route-group boundary so signed-out marketing pages can be statically rendered or cached. Measure the result in production Core Web Vitals before and after.

### 3. `/landing` still exists as a duplicate route

The canonical points to `/`, and this pass changes prominent internal links to `/`. Google may continue to show `/landing` until it recrawls and consolidates signals. Do not block `/landing` in robots because Google needs to crawl its canonical. A future routing refactor can remove direct access without breaking the internal rewrite used for signed-out `/`.

### 4. Trust claims need evidence

Numeric usage claims and testimonials should be backed by auditable product analytics or real customer permission. Unsupported social proof can hurt user trust and the experience/expertise/authority/trust signals the site needs. Keep only claims that can be demonstrated.

### 5. FAQ markup is not a ranking shortcut

Visible FAQs are useful for visitors and answer engines, but Google no longer gives general sites an FAQ rich result. Keep the content because it answers real questions; do not expect the markup itself to improve rankings.

## What to do after deployment

### First 7 days

1. Fix the `www` DNS/certificate problem.
2. Verify a Google Search Console **Domain property** for `envitefy.com`.
3. Submit `https://envitefy.com/sitemap.xml`.
4. Inspect and request indexing for `/`, `/invitation-maker`, `/weddings`, `/birthdays`, `/baby-showers`, `/snap`, `/studio`, and the strongest guide pages.
5. Add Bing Webmaster Tools and submit the same sitemap.
6. Confirm production canonicals use `https://envitefy.com`, not a deployment or localhost origin.
7. Record baseline non-brand impressions, clicks, CTR, average position, indexed-page count, and referring domains.

### First 30–90 days

- Improve the existing birthday, wedding, shower, upload, and RSVP pages with actual product screenshots, real examples, and outcome-focused explanations.
- Publish a small number of original resources based on first-hand expertise, such as invitation wording tools, RSVP deadline calculators, host checklists, and anonymized event-response research. Avoid mass-produced query-variation pages.
- Turn the best templates into genuinely useful, indexable examples with unique copy, editable previews, and links back to the relevant category or maker page.
- Earn relevant links through event planners, venues, parent organizations, gymnastics clubs, wedding vendors, school-resource sites, and real customer case studies.
- Seek product reviews and comparisons from independent publishers. Do not buy links or mass-post promotional comments.
- Use Search Console query data to update the pages already receiving impressions instead of guessing at dozens of new keywords.

## Keyword strategy

“Create an invite” is broad and extremely competitive. Build authority through clearer, higher-converting queries first:

- online invitation maker with RSVP
- create a digital invitation link
- birthday invitation with RSVP
- wedding invitation website with RSVP
- create an invitation from a flyer or screenshot
- online invitation guests can open without an app
- invitation with registry and RSVP
- event invitation with calendar and map

The head term can improve as these clusters earn engagement and links, but page-one placement cannot be guaranteed or produced by metadata alone.

## AI search strategy

- Keep important answers in crawlable HTML, not only inside interactive widgets.
- Lead useful pages with a concise answer, then show the workflow, proof, limitations, and examples.
- Maintain consistent organization and product entities across JSON-LD, About, contact, social profiles, and third-party references.
- Keep `llms.txt` as a discovery aid, but treat it as supplementary; it is not a substitute for indexable pages and authority.
- Publish original, non-commodity material that an answer engine has a reason to cite.
- Use clear image alt text and high-quality product imagery because Google’s generative search can surface images and video as well as text.

## Measurement cadence

Review weekly for the first 90 days:

- indexed status and canonical chosen by Google
- non-brand impressions and clicks by page/query cluster
- CTR changes after title/description updates
- average position for long-tail invitation queries
- referring domains and links to `/invitation-maker` and category pages
- Core Web Vitals and production response caching
- conversions from organic landing pages to Studio, Snap, and Concierge

Official guidance used for this audit:

- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [Google guidance for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Title link best practices](https://developers.google.com/search/docs/appearance/title-link)

