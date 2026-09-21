import fs from "node:fs";
import { spawnSync } from "node:child_process";

const scripts = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts;
const files = [
  ...scripts["test:create-facts"].replace(/^node --test /, "").split(" "),
  ...scripts["test:create-campaign"].replace(/^node --test /, "").split(" "),
  "src/lib/concierge/persona.test.mjs",
  "src/app/chat/page.test.mjs",
  "src/app/chat/ConciergeChatClient.snap-upload.test.mjs",
  "src/lib/concierge/generated-preview.test.mjs",
  "src/app/chat/ConciergeChatClient.contract.test.mjs",
  "src/app/api/creation/intake/stream/route.test.mjs",
  "src/app/chat/chat-preview-adapters.test.mjs",
  "src/lib/studio/*.test.mjs",
  "src/lib/studio/*.test.ts",
  "src/lib/studio/*.test.cjs",
  "src/app/studio/studio-workspace-*.test.mjs",
  "src/app/studio/studio-workspace-*.test.ts",
  "src/lib/live-card-*.test.mjs",
  "src/lib/live-card-*.test.ts",
  "src/lib/guest-rsvp.test.ts",
  "src/lib/event-messages.test.cjs",
  "src/lib/rsvp-host-notification.test.cjs",
  "src/lib/guest-event-details.test.ts",
  "src/lib/scan-event-page.test.mjs",
  ...scripts["test:calendar"].replace(/^node --test /, "").split(" "),
  "src/utils/rsvp-mailto.test.ts",
  "src/components/MapEmbed.test.cjs",
  "src/lib/meet-discovery/contract-regression.test.mjs",
  "src/lib/meet-discovery.test.ts",
  "src/lib/meet-discovery.source.test.mjs",
  "src/app/event/[[]id[]]/page.routing.test.mjs",
  "src/app/event/[[]id[]]/page.test.mjs",
  "src/app/card/[[]id[]]/page.test.mjs",
  "src/app/studio/StudioMarketingPage.navigation.test.mjs",
  "src/app/studio/StudioMarketingPage.showcase.source.test.mjs",
  "src/app/studio/StudioWorkspace.category-upload.source.test.mjs",
  "src/app/studio/workspace/StudioCategoryStep.editorial.source.test.mjs",
  "src/lib/download-artwork.test.ts",
  "src/app/api/ics/route.test.cjs",
  "src/components/concierge/ConciergeEventWebsite.guest.test.cjs",
  "src/components/studio/StudioLiveCardActionSurface.rsvp-mailto.source.test.mjs",
  "src/hooks/useVisualViewportInsets.test.mjs",
  "scripts/lib/create-offline-network.test.mjs",
];
const result = spawnSync(process.execPath, [
  "--import", "./scripts/lib/create-offline-network.mjs", "--test", "--test-concurrency=4", ...new Set(files),
], { stdio: "inherit", cwd: new URL("..", import.meta.url) });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
