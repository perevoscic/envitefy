# Saved details, Livia parsing, and invitation spacing

Update: at the user's subsequent request, the saved-details sidebar, mobile accordion, and separate saved-status banner were removed. The chat now keeps the conversation and composer clear, with retry inside the conversation. Desktop and mobile were checked on localhost: neither renders a saved-details panel. Parsing and spacing corrections remain. Biome passed; the 14 persona checks passed. UI checks retain the same two existing source-guard failures, and the VS Code linter bridge remains unavailable.

The notes below record the preceding iteration.

Applied on September 5, 2026, and exercised through the UI at http://localhost:3000/chat.

## What changed

- Desktop (1024px and wider): saved event details are always open beside the conversation, with independent scrolling. The review remains available with the product preview.
- Mobile: saved details start collapsed. The expanded content has a bounded scroll area so the composer remains available.
- Assistant messages use paragraphs with a small gap instead of empty lines rendered as additional line breaks. Guest-copy sanitation preserves existing line/paragraph boundaries instead of doubling every newline. The simple invitation groups related sentences into one paragraph per language.
- Name and age parsing recognizes ordinary inputs such as `Livia, 10 years old`, `Livia turning 10`, and birthday-context `Livia, 10`. Ages are excluded from calendar parsing; obvious month spelling mistakes beside a day are normalized.
- Explicit name, age, and schedule facts take precedence over conflicting model output. Generated titles use the event facts instead of the entire message.
- The narrow legacy repair recovers affected unpublished drafts when opened or listed. It preserves confirmed custom titles and authored wording, and replaces the generated “guest of honor” placeholder. Reads do not write to storage; the next normal edit persists the repaired draft. Published events are excluded.
- The shared product marketing catalog documents the responsive saved-details review.

## Localhost observations

1. Submitted the exact reported message: `Livia, 10 years old, on septmeber 25th.`
   - Title: `Livia is turning 10`.
   - Date: `September 25th`; no invented start time.
   - Wording: `Join us to celebrate Livia turning 10.`
2. Reopened the older affected draft from the screenshot. Its details and sidebar title recovered without retyping. Historical conversation messages remain historical, including the earlier incorrect question.
3. Requested English and Spanish wording with no gifts, private replies, and a private address. Both language sections rendered compactly in the conversation and side panel, with the same saved wording.
4. Checked desktop at 1920px and 1024px, and phone at 390 × 844. At phone width, the document measured 390px with no horizontal overflow. The review started closed; when opened, its content was capped at 352px and scrolled over 668px of content. The composer remained visible. The viewport override was reset afterward.

## Validation and limits

- Final focused concierge suite: **86 passed, 0 failed** across eight files (`layout-focused-final.log`). Includes name/age/date, authored-copy preservation, placeholder repair, languages, privacy, natural corrections, and fallback response behavior.
- Biome lint passed for all 13 touched files (`layout-biome-final.log`).
- Full TypeScript checking still reports repository errors, including three existing errors in `fallback.test.ts`. No diagnostics appeared in the changed runtime files (`layout-typescript-final.log`).
- VS Code diagnostics were attempted; the Chat to CLI linter bridge is unavailable (`layout-vscode.log`).
- Existing UI source guards: 9 passed, 2 failed on older function/source shapes. Intake source guards: 7 passed, 1 failed expecting an older authentication helper. Those expectations were not weakened (`layout-ui-validation.log`, `layout-intake-validation.log`).
- The broader legacy fallback run has 111 passes and 22 failures: the previously recorded 20 baseline failures plus two older TBD expectations now seeing the provisional TBC wording. No new parser compatibility failures remain (`livia-legacy-final.log`).
- The configured AI provider returns HTTP 429 with `credit_balance_exhausted` / `insufficient_quota`. Localhost therefore exercised deterministic fallback behavior; tailored AI conversation quality could not be revalidated. No credits were purchased or reset, and no invitations were published or sent.
