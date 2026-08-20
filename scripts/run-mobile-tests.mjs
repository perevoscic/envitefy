#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const full = args.has("--full");
const update = args.has("--update");
const playwrightCli = path.join(process.cwd(), "node_modules", "playwright", "cli.js");
const testArgs = [playwrightCli, "test"];

if (update) testArgs.push("--update-snapshots");

const result = spawnSync(process.execPath, testArgs, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    MOBILE_QA_FULL: full ? "1" : "0",
    MOBILE_QA_VISUAL: update || process.env.MOBILE_QA_VISUAL === "1" ? "1" : "0",
  },
  stdio: "inherit",
});

process.exit(result.status ?? 1);
