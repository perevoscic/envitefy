import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

registerHooks({ resolve(specifier, context, next) {
  const url = specifier.startsWith("@/") ? pathToFileURL(resolve("src", specifier.slice(2)))
    : specifier.startsWith(".") ? new URL(specifier, context.parentURL) : null;
  if (url && existsSync(new URL(`${url}.ts`))) return next(`${url}.ts`, context);
  return next(specifier, context);
} });
const { getDisplayTitle, buildStudioRequest } = await import("./studio-workspace-builders.ts");
const { createInitialDetails } = await import("./studio-workspace-sanitize.ts");

test("birthday artwork receives the host's exact headline and complete visual brief", () => {
  const theme = "Three toy performers with headsets, holographic lettering, pink purple and blue concert lights, giant glowing star, reflective stage and foreground glow sticks.";
  const details = { ...createInitialDetails(), category: "Birthday", name: "Livia", age: "10", eventTitle: "LIVIA IS TURNING 10!", theme, product: "live_card" };
  assert.equal(getDisplayTitle(details), "LIVIA IS TURNING 10!");
  const request = buildStudioRequest(details, "both", "page");
  assert.equal(request.event.title, details.eventTitle);
  assert.equal(request.event.userIdea, theme);
  assert.equal(getDisplayTitle({ ...details, eventTitle: "" }), "Livia's 10th Birthday");
});
