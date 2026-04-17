import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { generateStudioInvitation } from "../src/lib/studio/generate.ts";
import { STUDIO_PROMPT_SAMPLES } from "../src/lib/studio/sample-payloads.ts";

dotenv.config({ path: path.join(process.cwd(), ".env") });

type LiveCardRun = {
  slug: string;
  label: string;
  ok: boolean;
  warnings: string[];
  liveCard: unknown | null;
  error: unknown | null;
};

async function main() {
  const runs: LiveCardRun[] = [];

  for (const sample of STUDIO_PROMPT_SAMPLES) {
    const result = await generateStudioInvitation({
      mode: "text",
      surface: "page",
      event: sample.event,
      guidance: sample.guidance,
    });

    runs.push({
      slug: sample.slug,
      label: sample.label,
      ok: result.ok,
      warnings: result.warnings,
      liveCard: result.liveCard,
      error: result.errors ?? null,
    });
  }

  const jsonPath = path.join(process.cwd(), "qa-artifacts", "studio-sample-live-cards.json");
  const mdPath = path.join(process.cwd(), "qa-artifacts", "studio-sample-live-cards.md");
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });

  await fs.writeFile(jsonPath, JSON.stringify(runs, null, 2) + "\n", "utf8");

  const mdLines: string[] = [
    "# Studio Sample Live Cards",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
  ];

  for (const run of runs) {
    mdLines.push(`## ${run.label}`);
    mdLines.push("");
    mdLines.push(`Status: ${run.ok ? "ok" : "failed"}`);
    mdLines.push("");

    if (run.warnings.length > 0) {
      mdLines.push("Warnings:");
      for (const warning of run.warnings) {
        mdLines.push(`- ${warning}`);
      }
      mdLines.push("");
    }

    if (run.liveCard) {
      mdLines.push("```json");
      mdLines.push(JSON.stringify(run.liveCard, null, 2));
      mdLines.push("```");
      mdLines.push("");
    }

    if (run.error) {
      mdLines.push("```json");
      mdLines.push(JSON.stringify(run.error, null, 2));
      mdLines.push("```");
      mdLines.push("");
    }
  }

  await fs.writeFile(mdPath, `${mdLines.join("\n").trim()}\n`, "utf8");
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

void main();
