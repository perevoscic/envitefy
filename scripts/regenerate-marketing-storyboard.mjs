#!/usr/bin/env node
import "dotenv/config";
import path from "node:path";
import { rerunStoryboardForRun } from "./lib/campaign-run.mjs";
import { parseCliArgs } from "./lib/storyboard-generator.mjs";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function printUsage() {
  console.log(`Usage:
  node scripts/regenerate-marketing-storyboard.mjs --run-id <run-id>
  node scripts/regenerate-marketing-storyboard.mjs --run-dir <path>
`);
}

async function main() {
  const parsedArgs = parseCliArgs(process.argv.slice(2));
  if (parsedArgs.help === "true") {
    printUsage();
    return;
  }

  const runId = clean(parsedArgs["run-id"]);
  const runDir = clean(parsedArgs["run-dir"]);
  if (!runId && !runDir) {
    throw new Error("Either --run-id or --run-dir is required.");
  }

  const result = await rerunStoryboardForRun({
    runId: runId || undefined,
    runDir: runDir ? path.resolve(process.cwd(), runDir) : undefined,
  });

  console.log(`[marketing] storyboard regenerated: ${result.runPaths.runDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
