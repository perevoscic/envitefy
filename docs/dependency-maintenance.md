# Dependency maintenance

The September 9 Windows installation now uses Node 24.21.0 and npm 11.19.0, with both npm projects matching the committed lockfiles. Git, FFmpeg, QPDF, and Playwright Chromium were also installed or updated. See [the Windows update and verification record](dependency-updates-windows-2026-09-09.md) for versions, results, and remaining optional migrations.

The application and `video-studio/` have separate npm manifests and lockfiles. Run checks from the repository, not the home directory:

```sh
cd /Users/rj/Local_Dev/envitefy
npm outdated
npm audit
npm audit --omit=dev
npm --prefix video-studio outdated --include=dev
npm --prefix video-studio audit
```

`npm outdated` compares installed versions with both the newest version allowed by `package.json` (`wanted`) and the registry's `latest` tag. A latest tag can even point to a prerelease, so review the target before installing it. An exit code of 1 from `npm outdated` or `npm audit` can mean findings were reported; it does not by itself mean the command failed.

Use npm and the committed `package-lock.json` files to reproduce these installations. The historical `bun.lockb` was not updated. Node 24 is declared in both manifests, `.nvmrc`, and the Docker base image. Node 20 is end of life, and the current PDF and Supabase packages require newer runtimes. See the [Node release schedule](https://nodejs.org/en/about/previous-releases).

## September 8, 2026 update

Updated 43 direct app dependencies, including compatible minor/patch releases of the AWS and Google SDKs, Supabase, Radix components, database client, and development tools. Removed the unused, vulnerable `node-qpdf` wrapper; PDF optimization continues to call the `qpdf` executable through the existing implementation.

| Package | Previous installed version | Updated version |
| --- | --- | --- |
| Next.js | 15.5.9 | 15.5.25 |
| React / React DOM | 19.1.0 | 19.2.8 |
| NextAuth | 4.24.11 | 4.24.15 |
| Sharp | 0.34.4 | 0.35.4 |
| PDF.js | 5.5.207 | 6.3.289 |
| Canvas | 0.1.95 | 1.0.8 |
| Nodemailer | 6.10.1 | 10.0.1 |
| Tailwind CSS | 4.1.12 | 4.3.3 |
| TypeScript | 5.9.2 | 5.9.3 |
| Prisma / Prisma client | 6.15.0 | 6.19.3 |
| Remotion packages (video studio) | 4.0.521 | 4.0.522 |

The video studio also uses React 19.2.8, Tailwind 4.3.3, and ESLint 9.39.5. All Remotion packages remain on one exact version. Major migrations such as Next.js 16, TypeScript 7, Prisma 7+, and the remaining SDK majors were not performed in this security update.

The app and PDF.js must resolve the same native canvas version. Loading canvas 0.1.100 and 1.0.8 together caused a process shutdown crash during verification; sharing canvas 1.0.8 fixed it.

## Security overrides

Keep these overrides until the consuming packages adopt patched compatible releases. Recheck them during future upgrades rather than removing them solely because an install succeeds.

| Override | Reason and validation |
| --- | --- |
| NextAuth → application's Nodemailer | NextAuth's optional mail peer range still targets version 7. Envitefy uses Google and Credentials providers, while its own SMTP code needs the patched mailer. Offline message composition and session token tests pass. |
| Next.js → PostCSS 8.5.28 | Next.js 15 pins vulnerable PostCSS 8.4.31. The patched 8.x API passes CSS/source-map tests and the production build. |
| Prisma config → deepmerge-ts 8.0.2 | Fixes recursive merge stack exhaustion while retaining Prisma 6. Config-file loading is tested. |
| Older UUID → 11.1.1 | Fixes bounds checking while preserving CommonJS and the `v4()` API used by Google clients. |
| Older qs → 6.16.0 | Applies the patched 6.x query-string parser. |

During this update npm retained an invalid nested PostCSS copy after changing the override. A clean lockfile resolution followed by `npm ci --include=dev` removed it. Always confirm the installed tree with `npm ls --all`; editing an override alone is insufficient.

## Audit results

- App production dependencies: **0 reported vulnerabilities**, down from 47.
- App including development dependencies: **0 reported vulnerabilities**, down from 60 total findings including 5 critical.
- Video studio: **0 reported vulnerabilities**, down from 2 low findings.
- The final app dependency tree contains no `tar` package.

Replaced `@lhci/cli` 0.15.1 with direct development dependencies on Lighthouse 13.4.1 and chrome-launcher 1.2.1. The installed chain now uses Puppeteer Core 25.10.0 and `@puppeteer/browsers` 3.2.2, removing `extract-zip` and its six propagated high findings. This avoids the unpatched ZIP library described in [GHSA-jmr9-qjv8-65gv](https://github.com/advisories/GHSA-jmr9-qjv8-65gv) and [GHSA-7pqw-9j4j-h8q3](https://github.com/advisories/GHSA-7pqw-9j4j-h8q3). The obsolete `tmp` override and external-editor compatibility test were removed with that dependency chain. A fresh full audit, production audit, and studio audit each report zero findings.

These are registry advisory results, not a guarantee that every reachable application vulnerability has been eliminated. No production deployment was performed.

## Lighthouse checks

```sh
npm run test:lighthouse:runner
npm run test:mobile:lighthouse
```

The mobile command builds the app, starts its own production server on localhost:3100, and runs Lighthouse three times each against `/landing`, `/gymnastics`, and `/snap`. Chrome or Chromium must be installed; set `CHROME_PATH` if automatic discovery does not find the executable. The runner uses a separate temporary browser profile and stops its own browser and server on completion, failure, or interruption. It refuses an occupied port rather than auditing another process. To audit an existing production build without rebuilding, run `node scripts/run-lighthouse.mjs`.

`lighthouse.config.json` replaces `lighthouserc.json`. Mobile emulation, DevTools throttling, and all four thresholds are preserved: accessibility ≥0.90, performance ≥0.80, LCP ≤2500 ms, and CLS ≤0.10. As in the previous LHCI configuration, each assertion uses its best value across the three runs (LHCI's default optimistic aggregation). Performance-score failures are warnings; the other thresholds fail the command. Error-level checks with no valid measurement and Lighthouse runtime failures also fail the command. Runs are signed out; each run records its final URL so any authentication redirects remain visible.

Every invocation writes a separate timestamped directory under `qa-artifacts/lighthouse/`, containing HTML and JSON reports for each run plus `summary.json` with measurements, assertions, final URLs, and pass/fail status. Partial reports are retained on failure. These local reports are ignored by Git. The runner follows Lighthouse's [programmatic API](https://github.com/GoogleChrome/lighthouse/blob/main/docs/readme.md#using-programmatically).

The migration verification completed all nine browser audits with no Lighthouse runtime failures and saved nine HTML and nine JSON reports. It exited with code 1 because every route exceeded the unchanged LCP budget; all other configured assertions passed. These page-speed findings remain separate follow-up work. The best values used by the assertions were:

| Route | Accessibility | Performance | LCP (limit 2500 ms) | CLS |
| --- | --- | --- | --- | --- |
| `/landing` | 0.96 | 0.80 | 3804 ms | 0 |
| `/gymnastics` | 0.98 | 0.88 | 3013 ms | 0 |
| `/snap` | 0.98 | 0.90 | 2824 ms | 0 |

An occupied-port check correctly exited with code 1 without touching the existing server. Separate cancellation checks during Chrome startup (SIGINT) and an active audit (SIGTERM) exited with codes 130 and 143, preserved valid summary JSON, released port 3100, and left no browser processes behind. Summary replacement is atomic, with one writer, to prevent report corruption during shutdown.

## Verification

```sh
npm run test:dependencies
npm run test:customer-entrypoints
npm run test:lighthouse:runner
npm run build
npm --prefix video-studio test
npm --prefix video-studio run lint
npm --prefix video-studio run build
```

The 62 dependency checks exercise image resizing and WebP output, real PDF text extraction and page rendering, mail composition without delivery, encrypted session tokens, Prisma config loading, CSS processing, upload validation, public routing, branding, and calendar preservation. They use Node's native test runner with a small resolver for the app's TypeScript imports. All pass with a successful process exit. Nine additional runner tests cover Lighthouse aggregation, threshold boundaries, warnings, missing measurements, runtime failures, server readiness, startup failure, and cleanup. Customer entrypoint tests, the production build, video tests/lint/bundle, and Remotion version consistency checks also pass. The production landing page was inspected in a browser without console errors; authenticated user workflows and live email delivery were not exercised.

The full app type check still reports existing repository errors. The baseline had 255 diagnostics; after repairing the incomplete installation and upgrading dependencies it has 149, with no new diagnostics in the comparison. Biome passes for edited code. The VS Code diagnostics wrapper could not run because no Chat to CLI linter bridge was available; the standalone TypeScript comparison was used as additional verification. `next build` skips type validation in this repository and should not replace these checks.
