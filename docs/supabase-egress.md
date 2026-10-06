# Supabase egress: findings, implementation and rollout

The previous billing cycle showed **5.929 GB of Shared Pooler Egress**: PostgreSQL responses sent through Supavisor. This is transferred data, not database storage size. Historical logs do not establish which September requests produced those bytes. Current large rows demonstrate an avoidable source of future egress, not a proven attribution of that historical total.

## Verified baseline on October 6, 2026

- Recursive, read-only audit: **10 event records, 20 embedded image fields, 20,346,242 encoded bytes**. The audit includes attachments, thumbnails, a profile image and eight copies of gym layout images inside two events and their builder snapshots.
- Every audited image is a base64 JPEG, PNG or WebP. At least one record is medical and requires encrypted storage with owner-only delivery.
- Read-only SQL verification against the current **180 records**: full event JSON is **22,184,701 bytes**; the new projected legacy list data is **259,143 bytes**, about **98.8% smaller**. These are JSON payload estimates, not Supabase network-meter readings.
- Two successive card pages returned two different records each, totaling **833** and **939** response-item bytes in that check.
- Local metadata reports: `output/egress-audit-2026-10-06.json` and `output/egress-query-verification-2026-10-06.json`. `output/` is Git-ignored. Reports contain paths, sizes and signatures, not event contents or image bytes.

## Implemented changes

1. **Exclude large data in SQL.** Legacy full-list and co-host queries use field projections. Slug matching reads identities and titles, then loads only the selected event. Single-event editing still loads its complete document.
2. **Offer bounded card pages.** `GET /api/history?view=cards&limit=40` returns ID, title, slug, creation time and small card data: dates, timezone, category, status, thumbnail reference and ownership. Pass the returned `nextCursor` as `cursor` for another page. Pages order by creation time and UUID, preserving timestamp precision and handling null dates. This view supports `time=all`; existing dashboard/sidebar views retain their counts, time filters and ordering. Membership is checked in SQL on each card-page request.
3. **Store public gymnastics images before persistence.** Explicit editor saves and server discovery persistence upload nested images/documents, replace their references and deduplicate copies. Upload failures retain the caller's unsaved data. Selecting a file alone does not save an event. Medical and passcode-protected inline media is refused by this public transport and must use authenticated storage.
4. **Reject new transient media at write boundaries.** Validation walks objects and arrays, including builder snapshots, and rejects `data:` and browser `blob:` references. Validation messages omit image/document contents. Main insert, replace, merge, collaborative, signup and slug-save writers share the guard. Existing medical originals continue using the encrypted upload pipeline.
5. **Share repeated reads.** Concurrent history queries are coalesced per account, view, limit, filter and mutation revision. Existing 30-second history/dashboard caches and mutation invalidation remain. Co-host history membership is read freshly and never joined into the owner's cached result.
6. **Measure query results.** `DB_EGRESS_METRICS=1` enables `[db-egress]` logs with query fingerprint/name, route, call count, row count and estimated JSON bytes. History/dashboard routes supply route context. No query parameters, event contents or image bytes are logged. Direct projection queries have named metrics. Estimates exclude PostgreSQL/network protocol overhead and do not capture every direct transactional query.

## Migration safety and execution order

Deploy the application changes **before** applying the migration. In particular, medical references depend on the new `/api/events/:id/private-media/:assetId` route. It reads only one encrypted Blob reference in SQL and checks the current owner before downloading or decrypting bytes. Responses are private and uncached. The migration verifies the deployed route version and encryption-key identifier before uploading medical media; mismatched local/production keys stop it.

The migration defaults to a read-only metadata audit. Its previous dry-run uploaded files; that defect is fixed. Dry-run audits all records. `--limit`, `--cursor` and `--exclude-user-id` control apply batches.

```powershell
node --experimental-strip-types scripts/transport-event-media-to-blob.ts --dry-run --json-report --report-path output/egress-audit.json
```

After deploying and verifying the owner/non-owner image behavior, run apply using the existing Envitefy database and Blob configuration, with the same original-document encryption key as production:

```powershell
node --experimental-strip-types scripts/transport-event-media-to-blob.ts --apply --backup-dir output/media-backups --private-media-origin https://envitefy.com --json-report --report-path output/egress-migration.json
```

Apply only selects candidate records. It writes and decrypt-verifies an encrypted backup of each original JSON document before uploading. Every attachment original retains its exact bytes and name in encrypted Blob storage, delivered through the existing owner-only original endpoint. Public display/thumbnail assets use the existing WebP pipeline. Medical images also retain exact bytes in encrypted Blob storage with authenticated delivery. Uploaded display/thumbnail/source assets are read back and verified before replacing database references. Repeated nested images share one uploaded reference within the record.

Each update compares the original JSON signature. A concurrent edit prevents replacement. Any unsupported field prevents that record's update. Draft and passcode-protected records are skipped for a separate private-media migration; none were identified in the current 10-record policy check. Failed uploads or conflicts can leave unreferenced Blob files, while the original database contents remain. Review the apply report's `unsupported` and `remainingRecords`, then rerun dry-run. Preserve backups and the encryption secret until rollback is no longer needed; restore under an event lock and compare the current revision before replacing data.

## Production verification and measurement

Local implementation and read-only audits do not deploy the application or migrate production records. After rollout:

1. Verify a nested inline-image save is rejected; an explicit public gym-layout save stores a Blob URL and succeeds. Confirm upload failure retains editor changes and event writes still require the original revision.
2. Verify a medical thumbnail loads for its owner and fails for a signed-out user or another account. Revoke co-host access and check that new card/history requests and editor saves respect revocation.
3. Enable `DB_EGRESS_METRICS=1` for a bounded measurement period. Aggregate `calls`, `rows` and `estimatedBytes` by route and query name. Compare equivalent traffic before/after deployment, including cache hits that avoid the query entirely.
4. Compare daily Supabase **Shared Pooler Egress** across several complete UTC days. Storage/Blob image delivery is measured separately. Historical September attribution remains unproven even if future egress falls.

Validation commands:

```powershell
npm run typecheck
npm run test:create-remediation
node --test src/lib/event-media.test.ts src/lib/history-cache.test.mjs src/lib/query-egress.test.mjs src/lib/db.history-projection.source.test.mjs scripts/event-collaboration.test.cjs scripts/egress-remediation.test.cjs src/app/api/dashboard/route.cache.test.mjs
```

Local validation on October 6, 2026: application TypeScript and the standalone migration-script TypeScript check passed; the Create remediation suite passed **826 tests with zero failures**. Biome reported no errors in touched files. The production private-media endpoint returned **404**, confirming that deployment is still required before applying the migration. No production records were changed and no migration uploads were performed.

The VS Code lint bridge returned `file_outside_workspace` for the Envitefy paths because its open workspace is Choreografy. Rerun `npm run lint:vscode -- <touched files>` from an Envitefy VS Code workspace. CLI TypeScript and Biome checks are independent of that bridge.
