# Custom product URLs

Every created Event Page, Live Card, Sign-up Form and saved schedule exposes **Custom URL**. Event Pages use the shared workspace control; gymnastics places it inside its grouped Page settings menu. Custom/generated Event Pages use their existing menu entry. Live Cards expose the dialog in Event details beside Edit card text, Sign-up Forms in Share your signup, and saved schedules in their editor. Owner page toolbars also expose the dialog.

New creations receive a URL on explicit draft save. **Save link** changes only the address; pending content and artwork edits still use the existing save actions, and drafts stay private. Football retains its existing pre-publication URL selection and suggestions.

`EventUrlEditor` and `EventUrlDialog` load the owner-authorized saved record, show the correct product path, check availability without writes and submit a URL-only PATCH. The shared endpoint validates exact requested addresses and returns the committed record and revision. Editor history clients update their cached record; template editors also advance their saved draft revision. Subsequent content saves preserve the custom URL. Prior addresses remain reserved aliases through the existing transactional URL service.

Validation:

- `node --test src/lib/event-public-slug.test.cjs scripts/event-collaboration.test.cjs`
- `node --test scripts/product-urls-browser.test.cjs`
- `npm run typecheck`
- `npm run test:create-remediation`
- `npm run test:create-browser`
- `npm run test:unified-create`

The focused browser test exercises the actual shared Event Page workspace, Live Card builder and Sign-up Form builder on desktop and mobile. It checks URL prefixes, read-only availability, failed claim recovery, draft privacy, content preservation, later saves with the new revision, and owner restrictions.

Local verification on October 20, 2026: TypeScript passed; Biome reported no errors in the touched code; all 905 remediation checks, all 9 Create browser checks and all 24 unified-creation browser checks passed. The final focused URL/collaboration/signup checks passed 67 tests. The full unified command passed its 62 Node checks, then stopped because Bun was unavailable. The VS Code diagnostics bridge returned `file_outside_workspace` for this repository; TypeScript and Biome supplied the code diagnostics.
