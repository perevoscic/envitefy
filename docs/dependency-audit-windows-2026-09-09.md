# Windows dependency audit — September 9, 2026

The Windows maintenance actions were subsequently applied and verified. See [the completed update record](dependency-updates-windows-2026-09-09.md). The findings below describe the state before those installations.

Inspected `D:\Develop_local\envitefy`, both npm projects, their installed dependency trees, runtime configuration, Docker/CI configuration, and the Android wrapper. Queried the npm registry and official runtime release pages on September 9. This was an audit: no packages, runtimes, manifests, lockfiles, or application code were changed.

The September 8 Mac update is present in the committed files. The main application's Windows installation matches it. The main outstanding installation gap is `video-studio/node_modules`, which still contains 13 direct dependencies that conflict with its manifest and lockfile.

## Priority actions

| Priority | Component | Observed here | Recommended action |
| --- | --- | --- | --- |
| 1 | Video studio installation | 13 invalid direct dependencies; `npm ls --all` fails | Reinstall from its committed lockfile with `npm.cmd --prefix video-studio ci --include=dev`. Do this with studio/render processes stopped. |
| 1 | Node.js | 24.14.1 | Update within Node 24 to 24.21.0 LTS. Both manifests require `24.x`, `.nvmrc` says `24`, and Docker uses `node:24-slim`. |
| 1 | Playwright browsers | Package 1.63.0 is installed; required Chromium revision 1243 and its headless shell are absent | Run `node node_modules/playwright/cli.js install chromium`. The mobile test configuration uses Chromium. |
| 2 | npm | 11.16.0, from the user's global npm directory | Update to 11.19.0, the npm bundled with Node 24.21.0. Recheck command resolution after updating Node because the global npm shadows the bundled copy. |
| 2 | QPDF | No `qpdf` on PATH; Docker's apt package list also omits it | Install QPDF where PDF compression is required, or configure an existing binary with `QPDF_BIN`. Uploads intentionally fall back to the original PDF when it is unavailable. |
| 2 | Native canvas | 1.0.8 installed and locked; 1.0.9 available | Consider the patch update, then rerun the PDF/native-image checks and confirm the app and PDF.js still resolve one canvas copy. |
| 3 | Git for Windows | 2.47.1.windows.1 | Update to the maintained Windows build, currently 2.55.0(5). |
| 3 | FFmpeg | 7.1.1 | At minimum, update within its branch to 7.1.5. A move to 8.1.2 or latest stable 9.0.1 should include image/video verification. |
| 3 | Java, for Android work | Microsoft OpenJDK 21.0.8 | Update within JDK 21 to Microsoft's 21.0.12.1 build if maintaining the Android wrapper. |

Node 24.21.0 and its bundled npm version come from the [official Node distribution index](https://nodejs.org/dist/index.json). Node 24 is the current LTS, while Node 22 remains a supported older LTS according to the [Node release schedule](https://nodejs.org/en/about/previous-releases). The project has already standardized on 24.

The registry's newest npm is 12.0.2, but its Node 24 requirement starts at 24.15.0, above this PC's 24.14.1. Treat npm 12 as a separate major upgrade after updating Node; npm 11.19.0 is the conservative target here. See the [npm package metadata](https://registry.npmjs.org/npm/latest).

Other release references: [Git for Windows](https://git-scm.com/install/windows), [FFmpeg release branches](https://ffmpeg.org/download.html), and [Microsoft OpenJDK downloads](https://learn.microsoft.com/en-us/java/openjdk/download). FFmpeg's current installation already exposes `libwebp`, `libx264`, and AAC encoders; missing codecs are not the issue.

## Video studio: sync these existing updates first

| Dependency | Installed on Windows | Committed target | Registry latest |
| --- | --- | --- | --- |
| All eight direct Remotion packages, including `remotion` | 4.0.521 | 4.0.522 | 4.0.523 |
| React / React DOM | 19.2.3 | 19.2.8 | 19.2.8 |
| Tailwind CSS | 4.0.0 | 4.3.3 | 4.3.3 |
| React types | 19.2.7 | 19.2.18 | 19.2.18 |
| ESLint | 9.19.0 | 9.39.5 | 10.10.0 |

The reinstall above reproduces the already-reviewed Mac update without changing the lockfile. Afterwards, Remotion 4.0.523 is a further patch candidate: keep every Remotion package on the same exact version. Prettier is already at its committed 3.8.1, with 3.9.6 available. `@types/web` remains pinned at 0.0.166, with 0.0.356 available; check its DOM type interactions before changing it.

ESLint 9 reached end of life on August 6, 2026. Reproducing 9.39.5 fixes the installation mismatch, but migration to ESLint 10 remains a maintenance follow-up that must account for Remotion's lint configuration. See [ESLint version support](https://eslint.org/version-support/).

## Main application: optional migrations

All 62 direct app dependencies match their lockfile entries, and `npm ls --all` reports no missing, invalid, or extraneous dependency problems. The only newer version currently allowed by the declared direct-dependency ranges is canvas 1.0.9.

The following registry versions are outside the current ranges or exact pins. These are migration candidates, not evidence that the working installation is broken. The prior update deliberately deferred the large framework and SDK migrations.

| Dependency | Installed | Registry latest |
| --- | --- | --- |
| Next.js | 15.5.25 | 16.3.4 |
| TypeScript, both projects | 5.9.3 | 7.0.2 |
| `@prisma/client` | 6.19.3 | 7.10.0 |
| `prisma` CLI | 6.19.3 | **8.0.0-rc.13, a prerelease** |
| `openai` | 4.104.0 | 7.12.1 |
| `@google/genai` | 1.52.0 | 2.21.0 |
| `@google-cloud/aiplatform` | 5.14.0 | 7.4.0 |
| `@google-cloud/storage` | 7.22.0 | 8.1.0 |
| `@google-cloud/vision` | 5.3.7 | 6.1.0 |
| `googleapis` | 156.0.0 | 178.1.1 |
| `@vercel/speed-insights` | 1.3.1 | 2.0.0 |
| `cookie` | 1.1.1 | 2.0.1 |
| `dotenv`, app | 16.6.1 | 17.4.2 |
| `framer-motion` / `motion` | 12.43.0 | 13.2.0 |
| `ical-generator` | 9.0.0 | 11.1.1 |
| `lucide-react` | 0.473.0 | 1.43.0 |
| `react-tooltip` | 5.30.1 | 6.0.8 |

These values were returned by `npm outdated --json` against the public npm registry. Re-query before implementation. For Prisma, choose matching stable CLI/client versions explicitly; the CLI's `latest` tag currently resolves to an RC. Keep `@types/node` on 24 to match the runtime even though npm lists 26.5.0 as latest.

Preserve the existing security overrides until separately validated. The prior canvas mismatch caused a native shutdown crash; the current app and PDF.js resolve the same 1.0.8 package and passed real PDF rendering here. See [the September 8 maintenance record](dependency-maintenance.md) for the rationale and compatibility checks.

## Other machine and repository findings

- **Python:** The registry records Microsoft Store Python 3.11. The `python` command resolves to a WindowsApps alias and failed to start in this agent shell with a logon-session error; no `py` launcher was found. This does not establish that Python is absent or broken in a normal terminal. Verify shell access before replacing it. The product has no Python application requirements file; Python is used by auxiliary artwork/skill scripts.
- **Mac-specific helper scripts:** `scripts/convert-gender-reveal-art.mjs` hardcodes `/opt/homebrew/bin/ffmpeg`. Several one-off artwork scripts also refer to `/Users/rj/.codex/generated_images/...`. Installing newer Windows tools alone will not make those historical scripts portable; adapt their inputs and executable paths if reusing them.
- **npm versus Bun:** Bun 1.3.11 is installed and is explicitly used for the concierge persona-evaluation scripts. Installation should continue to use the committed npm lockfiles. The historical `bun.lockb` was not refreshed by the Mac update.
- **CI actions:** `.github/workflows/ecr-push.yml` uses checkout v4, setup-buildx v3, and build-push v5. Current release candidates for a maintenance change are [checkout 7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-buildx 4.3.0](https://github.com/docker/setup-buildx-action/releases/tag/v4.3.0), and [build-push 7.3.0](https://github.com/docker/build-push-action/releases/tag/v7.3.0). Review their migration requirements and run the workflow when updating.
- **Android:** The wrapper declares Android Gradle Plugin 8.7.3, compile/target SDK 35, and androidbrowserhelper 2.6.2. No committed Gradle wrapper/version properties were found. Pin a reproducible wrapper and validate the Android toolchain together before planning SDK/plugin upgrades. [AGP 8.7 documentation](https://developer.android.com/build/releases/agp-8-7-0-release-notes) lists Gradle 8.9 as its minimum/default and JDK 17 as its minimum/default. No Android build was run.
- **Other installed tooling:** Docker CLI 28.3.2 and Android platform-tools 36.0.0 are present. Their daemon/runtime health and upgrade compatibility were not tested. Global developer-tool npm packages were inventoried, but are outside the app/studio lockfiles and were not security-audited.
- **Browser downloads:** Existing older Playwright browser revisions do not satisfy Playwright 1.63.0. Its default headless Chromium launch failed specifically because revision 1243 was missing. Firefox and WebKit binaries expected by this package are also absent, but the current mobile test matrix only needs Chromium. [Playwright documents the separate browser-install step after package updates](https://playwright.dev/docs/browsers).

## Verification performed

| Check | Result |
| --- | --- |
| App installed tree, `npm ls --all` | Pass, no dependency problems |
| Studio installed tree, `npm --prefix video-studio ls --all` | Fail, 13 invalid direct packages |
| App full `npm audit` | 0 reported vulnerabilities |
| App production `npm audit --omit=dev` | 0 reported vulnerabilities |
| Studio `npm audit` | 0 reported vulnerabilities in the committed dependency resolution |
| `npm run test:dependencies` | **62 passed, 0 failed**, successful process exit |
| Default Playwright Chromium launch | Fail, required headless browser executable absent |
| App/PDF.js canvas resolution | Same native package |
| FFmpeg encoder inventory | WebP, H.264, AAC present |

The npm audit results describe the lockfile resolutions; they must not be interpreted as approval of the stale studio installation. No production deployment, external email, database migration, or application/browser end-to-end workflow was performed. The existing TypeScript baseline issues documented in the maintenance record were not re-evaluated in this dependency audit.

After installing the machine/runtime updates and syncing the studio, run:

```powershell
node --version
npm.cmd --version
npm.cmd ls --all
npm.cmd --prefix video-studio ls --all
npm.cmd run test:dependencies
npm.cmd --prefix video-studio test
npm.cmd --prefix video-studio run lint
npm.cmd --prefix video-studio run build
```

Use `npm.cmd run test:mobile` once the matching Playwright Chromium download is installed and the app's local environment is ready. A fresh full audit in both projects should accompany any further lockfile changes.
