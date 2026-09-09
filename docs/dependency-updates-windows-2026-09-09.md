# Windows dependency updates — September 9, 2026

Completed the Windows maintenance actions following the [dependency audit](dependency-audit-windows-2026-09-09.md). The system installers all returned success without requesting a reboot. The main app and video studio retain their committed package versions and lockfiles.

## Installed and verified

| Tool or dependency | Before | After |
| --- | --- | --- |
| Node.js | 24.14.1 | **24.21.0 LTS** |
| npm, user-global installation | 11.16.0 | **11.19.0** |
| Git for Windows | 2.47.1.windows.1 | **2.55.0.windows.5** |
| FFmpeg / FFprobe | 7.1.1 | **8.1.2**, Gyan essentials build |
| QPDF | Not on PATH | **12.4.1**, Chocolatey-managed |
| Playwright Chromium and headless shell | Required revision missing | **Revision 1243 / Chromium 153.0.8010.12** |
| Eight direct Remotion packages | 4.0.521 | **4.0.522** |
| Studio React / React DOM | 19.2.3 | **19.2.8** |
| Studio Tailwind | 4.0.0 | **4.3.3** |
| Studio React types | 19.2.7 | **19.2.18** |
| Studio ESLint | 9.19.0 | **9.39.5** |

Node and Git resolve from their existing `C:\Program Files` installations. npm resolves from `C:\Users\rjosan\AppData\Roaming\npm`; FFmpeg, FFprobe, and QPDF resolve through `C:\ProgramData\chocolatey\bin`. No conflicting `QPDF_BIN` assignment was found in the app's local environment files. Python 3.11.9 works in the normal Windows execution context and was left installed; its earlier failure was specific to the restricted shell.

The studio was installed using `npm --prefix video-studio ci --include=dev`. Its 13 invalid direct dependencies now match the Mac-tested resolution. Both installed trees pass `npm ls --all`, and both manifests and lockfiles are byte-for-byte unchanged from their pre-update backups.

Node downloads were checked against the [official Node checksums](https://nodejs.org/dist/v24.21.0/SHASUMS256.txt), and the MSI has a valid OpenJS Foundation signature. The [Git installer](https://github.com/git-for-windows/git/releases/tag/v2.55.0.windows.5) has a valid publisher signature and was checked against its release digest. FFmpeg was staged and verified against the [Gyan release archive](https://www.gyan.dev/ffmpeg/builds/), then updated through its existing Chocolatey installation. FFmpeg 7.1.5 was not available through that package manager, so the tested 8.1.2 release was selected. QPDF was installed through Chocolatey and the actual installed binary was tested after installation; staging also checked the official [QPDF 12.4.1](https://github.com/qpdf/qpdf/releases/tag/v12.4.1) archive.

## Repository changes

- Added `qpdf` to the Docker base image's apt package list so future container builds include PDF compression.
- Excluded `qa-artifacts` and `video-studio/build` from Docker build context. The local verification files, rollback copies, and studio bundle should not be copied into the application image.
- Added the studio's `build` output to its `.gitignore`.
- Fixed the customer-entrypoint test fixture to acknowledge the existing `@/lib/manual-event-progress` import. The same test failed on both Node 24.14.1 and 24.21.0 before the fixture change. All artwork-route assertions remain intact; no application routing behavior was changed.

Other changes being made concurrently in this workspace were preserved. No production deployment, database migration, email delivery, calendar connection change, or publishing operation was part of this maintenance task.

## Verification results

| Check | Result |
| --- | --- |
| App dependency checks on staged and installed Node 24.21.0 | **62 passed, 0 failed** |
| Customer-entrypoint checks after repairing the existing fixture | **24 passed, 0 failed** |
| Biome lint on the edited test | Pass |
| Main application production build | Pass; generated all 132 static pages |
| Studio narration tests | **5 passed, 0 failed** |
| Studio ESLint and TypeScript checks | Pass |
| Studio production bundle | Pass |
| Actual studio frame render | Pass, Remotion 4.0.522 + React 19.2.8, 540 × 960 WebP |
| App and studio full installed dependency trees | Pass, no dependency problems |
| App full audit, app production audit, studio audit | **0 reported vulnerabilities** in each |
| Production browser checks | **12 successful navigations** across six routes at desktop and mobile sizes; no uncaught page JavaScript errors |
| Playwright browser interaction | Pass |
| QPDF compression and document comparison | Four pages retained with identical extracted text; 467,895 → 449,451 bytes; `qpdf --check` passed |
| FFmpeg transparent WebP output | Correct dimensions and alpha preserved |
| FFmpeg H.264/AAC output | Encoded, probed, and fully decoded a sample MP4 successfully |
| Changed-file whitespace checks | Pass |

Browser checks used an isolated production server at port 3105 and covered `/landing`, `/weddings`, `/birthdays`, `/gymnastics`, `/envitefy-concierge`, and the signed-out `/chat` redirect. All final responses were HTTP 200. The signed-out chat visit reached the home/landing route. Mobile landing and wedding screenshots and the rendered studio frame were visually inspected. These checks did not exercise authenticated editing or live provider operations.

The Next.js build reported transient Windows cache-rename warnings, then completed successfully. This repository skips TypeScript validation in `next build`; its existing app-wide TypeScript baseline was not represented as passing. The studio's explicit TypeScript check did pass. Docker image execution could not be validated because Docker Desktop's Linux engine was stopped; the Dockerfile change has not been deployed.

## Follow-up and local records

Framework and SDK major migrations remain separate work: Next.js 16, TypeScript 7, Prisma, and the newer Google/OpenAI SDK majors were not needed to synchronize this machine. Optional canvas 1.0.9 and Remotion 4.0.523 updates were also deferred to preserve the tested Mac resolution. ESLint 9 remains end-of-life, so an ESLint 10 migration that is compatible with Remotion's lint configuration remains a maintenance item.

Already-running Node processes retain the runtime they started with. New commands use Node 24.21.0; existing development servers and tool sessions use it after their next restart. Existing user processes were not forcibly closed. The temporary verification server was stopped after checking the built application.

Logs, checksums, installer results, test results, and previous Node/npm/FFmpeg/studio installation copies are retained under the Git-ignored and Docker-excluded directory:

```text
qa-artifacts/dependency-updates-2026-09-09/
```

The rendered verification frame is `video-studio/out/fridge-freedom/dependency-smoke-2026-09-09.webp`. It was converted directly from the renderer's in-memory PNG buffer using FFmpeg quality 85 and compression level 6; no PNG/JPEG artwork original was saved to disk.
