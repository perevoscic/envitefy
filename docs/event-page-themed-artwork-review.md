# Reviewing replacement Event Page artwork

Every v2 image needs a technical review and a separate visual diversity review before delivery. Authored art-direction fields describe the intended result; they are not evidence of the generated image's appearance.

Generate inspection sheets and an exact-hash worklist with:

```powershell
node scripts/review-event-page-themed-artwork.mjs --collection baseball --subtype neighborhood-diamond --out .qa/themed-v2-review/baseball/neighborhood-diamond
```

Inspect the unlabeled six-image sheet to compare the actual medium, viewpoint, scale, focal placement, lighting, setting and narrative. Open full-size images for anatomy, equipment, lettering or other details that the sheet cannot resolve. Record observed differences, and regenerate repetitive or defective images before approving them. Color changes and substituted props alone do not establish a distinct visual concept.

The review-file JSON accepts `entries` (also `results`, `assets` or `reviews`). A v2 approval entry has this shape:

```json
{
  "id": "baseball--v2-neighborhood-diamond-chalk-line-journey",
  "sha256": "the installed WebP's exact SHA-256",
  "technicalReview": {
    "pass": true,
    "notes": "Record technical checks and any full-size inspection."
  },
  "diversityReview": {
    "pass": true,
    "cohortEvidence": ".qa/themed-v2-review/baseball/neighborhood-diamond/neighborhood-diamond-unlabeled.jpg",
    "observed": {
      "medium": "Describe what is visible.",
      "viewpoint": "Describe the actual angle.",
      "scale": "Describe the actual shot scale.",
      "placement": "Describe the visible focal placement.",
      "lighting": "Describe the actual light.",
      "setting": "Describe the visible setting.",
      "narrative": "Describe what happens in the image."
    }
  }
}
```

All seven observations must be nonempty strings. The cohort-evidence file must exist when the review is recorded. The installer verifies the supplied hash against the decoded installed WebP, stores both review objects and retains the report path. Use:

```powershell
node scripts/event-page-themed-artwork.mjs review-file --file .qa/themed-v2-review/baseball/neighborhood-diamond/review.json
```

The bare `reviewed` command rejects v2 artwork. `publish` enables a v2 image only when both review passes and all observed fields remain in its result metadata. A collection enters new selections only after all 60 images are delivered. Frozen delivered v1 addresses retain their original metadata and artwork; every publication verifies those files against the frozen manifest hashes before preserving their availability.

Generation uses one built-in ImageGen request per original asset. Corrections retain the original PNG and prior result hashes, and store the actual corrective prompt separately from the authored brief. Never split a generated collage into multiple assets or reuse a photograph to satisfy the collection count.
