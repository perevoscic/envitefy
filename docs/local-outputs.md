# Local generated outputs

Keep generated screenshots, exports, archives, HTML previews and verification reports under the repository-root `output/` folder. This entire folder is ignored by Git. Keep reusable scripts, editable designs and configuration in `scripts/`, and design notes and prompt/provenance records in `docs/`. Assets served by the application stay in their existing tracked asset directories, such as `public/`.

## Source locations

- [Play Store screenshot sources](../scripts/play-store-2026-09-22/README.md): capture and render scripts for phones and tablets. They write to `output/play-store-2026-09-22/`.
- `scripts/social-icons-reddit/`: historical social-icon migration and verification scripts. Generated previews, baseline snapshots and reports remain in `output/social-icons-reddit/`.
- `scripts/social-links-review/`: historical social-link verification scripts. Screenshots and reports remain in `output/social-links-review/`.
- [Facebook cover design notes](artwork/facebook-cover/design-notes.md) and [appointment sample provenance](artwork/appointment-samples-2026-09-10/prompts-and-provenance.json): retained generation records; their images remain local under `output/`.

Run scripts from the repository root. The historical social checks retain their original assumptions: a local development server for browser checks, saved baseline snapshots for the Reddit type comparison, and the original local reference image for the Reddit image comparison. `update-sets.cjs` is a source migration, not a preview command; do not rerun it just to regenerate output.

Generated deliverables are not included in fresh checkouts. Regenerate them from the retained sources or copy an existing local export when needed. Git still contains previously committed outputs in its history; ignoring and untracking them does not rewrite that history.
