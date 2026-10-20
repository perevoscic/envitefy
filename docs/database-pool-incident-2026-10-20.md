# Event page and artwork connection exhaustion

Production logs for `/event/atlantacentennialclassic-com-meet-6` at 2:18–2:20 p.m. America/Chicago contain error digest `3319034344` and the Supavisor error `(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15`. The streamed page had already sent HTTP 200 before rendering failed. HTTP status alone did not establish a successful render.

At 2:23:18 p.m., the same event's `/api/blob/event-media/17a96fd8-d5c8-4cc1-9daf-089ea6f9237e/theme-event-theme-xq3xfh-6f2cacc3-437b-4651-88ec-9fe5a6d75c3b.webp` request returned HTTP 500 with that same capacity error. Its legacy proxy performs a medical-source database check before reading storage. The generated image itself was intact: both storage endpoints returned an actual 1536×1024 WebP of 129,256 bytes during direct probes. Chrome's owner iframe reproduced the broken image with `complete: true` and `naturalWidth: 0`, including after a reload.

The shared Postgres pool previously allowed eight clients per process, retained idle clients for 30 seconds, and did not register Vercel lifecycle cleanup. A warm process does not imply a shared pool across all function instances. Vercel documents that suspended instances cannot run idle timers, leaving connections occupied. See [Vercel connection pooling](https://vercel.com/kb/guide/connection-pooling-with-functions). The logs confirm session capacity exhaustion; they do not identify the owner of each occupied connection.

The fix attaches every newly created pool to `attachDatabasePool` from `@vercel/functions`. On Vercel, default pool size is two and idle timeout is five seconds; explicit positive environment overrides and local defaults remain supported. Capacity errors are recognized as temporary database unavailability, but do not trigger new connection retries or pool replacement. A later request can use the existing pool after capacity returns.

Imported sports artwork displays through `/media/event-media/`, which already reads storage without Postgres. The saved artwork and user-uploaded hero retain their values. The legacy medical-source access checks remain in place.

Validation:

- Application typecheck and focused Biome lint passed.
- New pool tests cover concurrent initialization, lifecycle registration, deployment defaults, overrides, capacity rejection without reconnect storms, and subsequent recovery.
- New media test streams storage while a database stub rejects access; existing medical ownership tests pass.
- Chrome's local owner preview loaded the same saved image from `/media/event-media/` with `complete: true`, `naturalWidth: 1536`, and `naturalHeight: 1024`.
- The combined focused run had 57 passing tests and one existing failure: `retired IDs safely use the replacement collection; football retains its independent collection`. Its unchanged assertion requires all gymnastics IDs to be absent from the football registry. Neither registry is modified by this fix. Three separately run media/access tests passed.
- VS Code diagnostics could not inspect the files: the connected bridge returned `file_outside_workspace` for this `D:\Develop_local\envitefy` checkout. This is a diagnostics access failure, not a TypeScript failure.

These are local code changes. Production settings, saved event records and the deployed application were not changed during this investigation.
