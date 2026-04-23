#!/usr/bin/env node
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeCampaignInput, runCampaign } from "./lib/campaign-run.mjs";
import { parseCliArgs, buildLooseInputFromCli } from "./lib/storyboard-generator.mjs";
import { assembleVideoForRun } from "./lib/video-assembler.mjs";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function printUsage() {
  console.log(`Usage:
  npm run marketing:campaign -- --prompt "your campaign idea" [options]

Options:
  --product-name <text>
  --target-vertical <text>
  --tone <text>
  --cta <text>
  --job <label>
  --frames <n>
  --request-file <path-to-json>
  --run-dir <path>
  --skip-video
  --help
`);
}

async function loadInputFromRequestFile(requestFile) {
  const raw = await fs.readFile(requestFile, "utf8");
  const parsed = JSON.parse(raw);
  return parsed?.input || parsed;
}

async function main() {
  const parsedArgs = parseCliArgs(process.argv.slice(2));
  if (parsedArgs.help === "true") {
    printUsage();
    return;
  }

  let campaignInput;
  if (clean(parsedArgs["request-file"])) {
    campaignInput = await loadInputFromRequestFile(path.resolve(process.cwd(), clean(parsedArgs["request-file"])));
  } else {
    const looseInput = buildLooseInputFromCli(parsedArgs);
    campaignInput = normalizeCampaignInput({
      criteria: clean(parsedArgs.prompt) || looseInput.rawPrompt,
      productName: clean(parsedArgs["product-name"]),
      targetVertical: clean(parsedArgs["target-vertical"]),
      tone: clean(parsedArgs.tone),
      callToAction: clean(parsedArgs.cta || parsedArgs["call-to-action"]),
      jobLabel: clean(parsedArgs.job),
      notes: clean(parsedArgs.notes),
      outputRoot: clean(parsedArgs.output),
      looseInput,
    });
  }

  const shouldRenderVideo = parsedArgs["skip-video"] !== "true";
  const result = await runCampaign({
    campaignInput,
    runDir: clean(parsedArgs["run-dir"]),
    autoRenderVideo: false,
  });

  if (shouldRenderVideo) {
    await assembleVideoForRun({ runDir: result.runPaths.runDir });
  }

  console.log(`[marketing] run directory: ${result.runPaths.runDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
