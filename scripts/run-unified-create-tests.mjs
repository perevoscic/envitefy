import { spawnSync } from "node:child_process";

const batches = [
  [
    process.execPath,
    [
      "--test",
      "src/lib/creation-access.test.cjs",
      "src/lib/discovery/creation-authorization.test.mjs",
      "src/lib/events-workspace.test.cjs",
      "src/lib/create/editor-handoff.test.cjs",
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
      "src/lib/create/run-sport-discovery.test.ts",
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
      "src/lib/create/creation-intake.browser.test.cjs",
      "scripts/unified-create-browser.test.cjs",
    ],
  ],
];

for (const [command, args] of batches) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: new URL("..", import.meta.url),
  });
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
