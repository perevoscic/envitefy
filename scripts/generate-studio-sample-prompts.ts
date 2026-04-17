import fs from "node:fs/promises";
import path from "node:path";
import { buildInvitationImagePrompt, buildLiveCardPrompt } from "../src/lib/studio/prompts.ts";
import { STUDIO_PROMPT_SAMPLES } from "../src/lib/studio/sample-payloads.ts";

function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

async function main() {
  const outputPath = path.join(process.cwd(), "qa-artifacts", "studio-sample-prompts.md");
  const lines: string[] = [
    "# Studio Sample Prompts Review",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "These sample payloads are strict user-input-style fixtures.",
    "They intentionally avoid invented decor facts such as balloon colors, dessert tables, or live music unless that information is explicitly present in the payload itself.",
    "",
  ];

  for (const sample of STUDIO_PROMPT_SAMPLES) {
    const liveCardPrompt = buildLiveCardPrompt(sample.event, sample.guidance);
    const imagePrompt = buildInvitationImagePrompt(sample.event, sample.guidance, null, {
      surface: "image",
    });

    lines.push(`## ${sample.label}`);
    lines.push("");
    lines.push("### Payload");
    lines.push("");
    lines.push("```json");
    lines.push(stableJson({ event: sample.event, guidance: sample.guidance }));
    lines.push("```");
    lines.push("");
    lines.push("### Live Card Prompt");
    lines.push("");
    lines.push("```text");
    lines.push(liveCardPrompt);
    lines.push("```");
    lines.push("");
    lines.push("### Image Prompt");
    lines.push("");
    lines.push("```text");
    lines.push(imagePrompt);
    lines.push("```");
    lines.push("");
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${lines.join("\n").trim()}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

void main();
