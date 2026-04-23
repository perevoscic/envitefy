#!/usr/bin/env node
import "dotenv/config";
import { parseCliArgs } from "./lib/storyboard-generator.mjs";
import { assembleVideoForRun } from "./lib/video-assembler.mjs";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function printUsage() {
  console.log(`Usage:
  npm run storyboard:video -- --run <run-id-or-path>
`);
}

async function main() {
  const parsedArgs = parseCliArgs(process.argv.slice(2));
  if (parsedArgs.help === "true") {
    printUsage();
    return;
  }

  const run = clean(parsedArgs.run || parsedArgs["run-id"] || parsedArgs["run-dir"]);
  if (!run) {
    printUsage();
    throw new Error("A run id or run directory is required.");
  }

  const isRunId = !run.includes("/") && !run.startsWith(".");
  const result = await assembleVideoForRun(isRunId ? { runId: run } : { runDir: run });
  console.log(`[storyboard-video] video ready: ${result.videoPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
