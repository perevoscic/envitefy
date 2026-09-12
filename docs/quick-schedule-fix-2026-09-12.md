# Practice and game schedule quick pages — September 12, 2026

Uploads retain a canonical scanSchedule through OCR, Dashboard review, Concierge follow-up turns, explicit saves, draft resume, editing and public rendering. A practice row records its group and weekday independently of dated games. Unknown dates/times remain visible for review; weekly rows do not invent calendar occurrences.

The practice table fallback previously swallowed OFF cells and shifted following weekdays. It now retains Monday/Wednesday/Friday sessions and consecutive OFF cells, supports short weekday tables, and preserves 24-hour afternoon times. The quick-page builder and public reader now retain every game rather than losing or truncating rows.

Dashboard opens ScheduleReviewDialog before saving a schedule. Save progress remains separate from Publish page. Editing uses /event/schedule/customize?edit=ID, retains the original document and artwork, updates canonical timing, and preserves published status. Schedule uploads belong to My events.

The 60 targeted tests cover parser-to-payload-to-JSON-to-public rendering, two games, a 48-row season, mixed/unknown timing, Concierge follow-up persistence and both resume-link builders. Browser checks with synthetic data verified mobile scrolling, save-error recovery, unsaved-progress choices and all three practice rows after retry. No real account records were created by the browser check; its temporary fixture was removed.

The new modules pass a focused TypeScript check and Biome lint. Broader TypeScript checks still report existing errors in the event dispatcher, meet discovery and other modules. The VS Code diagnostics bridge was unavailable. OCR model responses are mocked in regression tests; this check does not establish accuracy for every uploaded photo or PDF.
