import { spawnSync } from "node:child_process";

const batches = [
  [
    process.execPath,
    [
      "--test",
      "src/lib/creation-access.test.cjs",
      "src/lib/creation-access-server.test.cjs",
      "src/lib/db.feature-visibility-schema.test.cjs",
      "src/lib/create/creation-access-client.test.cjs",
      "src/lib/feature-visibility-client.test.cjs",
      "src/lib/signup-onboarding.test.mjs",
      "src/app/api/user/creation-access/route.test.cjs",
      "src/app/api/user/feature-visibility/route.test.cjs",
      "src/app/create/page.test.cjs",
      "src/app/api/create/extract/route.test.mjs",
      "src/app/create/live-card-alternate.test.cjs",
      "src/lib/discovery/creation-authorization.test.mjs",
      "src/lib/discovery/persist-concurrency.test.mjs",
      "src/lib/events-workspace.test.cjs",
      "src/lib/create/editor-handoff.test.cjs",
      "src/lib/create/creation-template-loader.test.cjs",
      "src/lib/create/holiday-collections.test.cjs",
      "src/lib/event-page-themed-designs.test.cjs",
      "src/components/events/EventPageReadOnlyContext.test.cjs",
      "src/lib/general-event-presentation.test.cjs",
      "src/lib/holiday-backgrounds.test.cjs",
      "src/lib/holiday-background-expansion.test.cjs",
      "src/lib/manual-event-backgrounds.test.cjs",
      "src/lib/signup-holiday-backgrounds.test.mjs",
      "src/lib/event-page-presentation-directions.test.cjs",
      "scripts/build-event-page-themed-artwork.test.mjs",
      "scripts/event-page-themed-artwork.test.mjs",
      "src/app/left-sidebar.create-access.test.mjs",
      "src/app/left-sidebar.signup-forms.test.mjs",
      "src/app/left-sidebar.my-events.test.mjs",
    ],
  ],
  [
    "bun",
    [
      "test",
      "src/lib/create/create-intent.test.ts",
      "src/lib/create/creation-navigation.test.ts",
      "src/lib/create/read-source.test.ts",
      "src/lib/create/extract-information.test.ts",
      "src/lib/create/extraction-progress.test.ts",
      "src/lib/create/merge-discovery-editor-refresh.test.ts",
      "src/lib/create/sport-source-intake.test.ts",
      "src/lib/create/run-sport-discovery.test.ts",
      "src/lib/discovery/extraction-reuse.test.ts",
      "src/lib/discovery/status.test.ts",
      "src/lib/meet-discovery/dates.test.ts",
      "src/lib/hotel-resource-links.test.ts",
      "src/lib/discovery/intake-recovery.test.ts",
      "src/lib/discovery/browser-network.test.ts",
      "src/lib/event-draft-access.test.ts",
    ],
  ],
  ["bun", ["test", "src/lib/ocr/text-intake.test.ts", "src/lib/pending-snap-upload.test.ts"]],
  [
    process.execPath,
    [
      "--test",
      "--test-concurrency=1",
      "scripts/auth-modal-browser.test.cjs",
      "scripts/feature-visibility-browser.test.cjs",
      "scripts/creation-access-browser.test.cjs",
      "scripts/event-cache-dashboard-browser.test.cjs",
      "src/lib/create/creation-intake.browser.test.cjs",
      "scripts/unified-create-browser.test.cjs",
      "scripts/event-page-themed-header-browser.test.cjs",
      "scripts/event-page-themed-body-browser.test.cjs",
      "scripts/event-page-themed-editor-browser.test.cjs",
      "scripts/holiday-backgrounds-browser.test.cjs",
      "scripts/holiday-background-options-browser.test.cjs",
      "scripts/holiday-expansion-preview-browser.test.cjs",
      "scripts/event-editor-navigation-browser.test.cjs",
    ],
  ],
];

for (const [command, args] of batches) {
  // npm-installed Bun uses a command shim on Windows. The Bun batches above
  // contain only fixed relative test paths, so cmd can resolve that shim.
  const windowsBun = process.platform === "win32" && command === "bun";
  const result = spawnSync(
    windowsBun ? process.env.ComSpec || "cmd.exe" : command,
    windowsBun ? ["/d", "/s", "/c", `bun ${args.join(" ")}`] : args,
    {
      stdio: "inherit",
      cwd: new URL("..", import.meta.url),
    },
  );
  if (result.error) {
    console.error(
      result.error.code === "ENOENT" && command === "bun"
        ? "This fixture suite requires Bun on PATH. Install the project's Bun test runtime and rerun."
        : result.error,
    );
    process.exitCode = 1;
    break;
  }
  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    break;
  }
}
