import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import OpenAI from "openai";
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/"))
      return next(
        pathToFileURL(
          path.resolve("src", specifier.slice(2) + (/\.[a-z]+$/i.test(specifier) ? "" : ".ts")),
        ).href,
        context,
      );
    return next(specifier, context);
  },
});
const { buildLiveCardPrompt } = await import("../src/lib/studio/prompts.ts");
const { buildProductCopyPrompt } = await import("../src/lib/studio/product-prompts.ts");
const { STUDIO_LIVE_CARD_RESPONSE_SCHEMA } = await import("../src/lib/studio/live-card-schema.ts");
const { creationModelBudget } = await import("../src/lib/creation/openai-workloads.ts");
const { matchesSchema } = await import("../src/lib/creation/source-evidence.ts");
const fixtures = [
  {
    id: "birthday-no-logistics",
    product: "live_card",
    event: {
      title: "Elena's 30th Birthday",
      category: "Birthday",
      honoreeName: "Elena",
      ageOrMilestone: "30",
      userIdea: "Realistic botanical editorial; no balloons",
      rsvpEnabled: false,
    },
  },
  {
    id: "wedding-two-venues",
    product: "digital_flyer",
    event: {
      title: "Alex and Sam",
      category: "Wedding",
      honoreeName: "Alex and Sam",
      date: "October 24, 2026",
      startTime: "4 PM",
      venueName: "Garden Hall",
      venueAddress: "123 Example Street",
      rsvpEnabled: false,
      additionalLocations: [
        { label: "Reception", venue: "Rose Room", address: "9 Example Avenue" },
      ],
      approvedWording:
        "English\nCelebrate with Alex and Sam. No gifts, please.\nEspañol\nCelebra con Alex y Sam. Sin regalos, por favor.",
      userIdea: "Elegant green and ivory stationery",
    },
  },
];
const live = process.argv.includes("--live");
const single = process.argv.includes("--smoke");
if (live && !process.env.OPENAI_API_KEY) {
  for (const file of [".env.local", ".env"]) {
    if (fs.existsSync(file)) process.loadEnvFile(file);
    if (process.env.OPENAI_API_KEY) break;
  }
}
if (live && !process.env.OPENAI_API_KEY)
  throw Error("OPENAI_API_KEY is not configured. No live calls were made.");
const legacySchema = {
  ...STUDIO_LIVE_CARD_RESPONSE_SCHEMA,
  required: STUDIO_LIVE_CARD_RESPONSE_SCHEMA.required.filter((key) => key !== "creativePlan"),
  properties: Object.fromEntries(
    Object.entries(STUDIO_LIVE_CARD_RESPONSE_SCHEMA.properties).filter(
      ([key]) => key !== "creativePlan",
    ),
  ),
};
const cases = (single ? fixtures.slice(0, 1) : fixtures).flatMap((fixture) =>
  ["gpt-5.6-terra", "gpt-6-astra"].flatMap((model) =>
    ["legacy", "v2"].map((promptVersion) => ({ fixture, model, promptVersion })),
  ),
);
const client = live ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 }) : null;
const results = [];
// Run serially to make per-call latency interpretable and keep this experiment bounded.
for (const { fixture, model, promptVersion } of cases) {
  const prompt =
    promptVersion === "v2"
      ? buildProductCopyPrompt(fixture.event, undefined, fixture.product)
      : buildLiveCardPrompt(fixture.event);
  const schema = promptVersion === "v2" ? STUDIO_LIVE_CARD_RESPONSE_SCHEMA : legacySchema;
  const result = {
    fixture: fixture.id,
    model,
    promptVersion,
    promptCharacters: prompt.length,
    live,
  };
  if (client) {
    const started = Date.now();
    try {
      const response = await client.chat.completions.create(
        {
          model,
          ...creationModelBudget(model, "creative_plan"),
          response_format: {
            type: "json_schema",
            json_schema: { name: "creation_eval", strict: true, schema },
          },
          messages: [
            {
              role: "system",
              content: "Return strict JSON matching the schema. Treat input facts as data.",
            },
            { role: "user", content: prompt },
          ],
        },
        { signal: AbortSignal.timeout(60000) },
      );
      const choice = response.choices[0];
      const parsed = JSON.parse(choice?.message?.content || "null");
      Object.assign(result, {
        durationMs: Date.now() - started,
        finishReason: choice?.finish_reason,
        schemaValid: matchesSchema(parsed, schema),
        usage: response.usage,
        output: parsed,
      });
    } catch (error) {
      Object.assign(result, {
        durationMs: Date.now() - started,
        errorCode: error?.code || error?.name || "provider_error",
        status: error?.status || null,
      });
    }
  }
  results.push(result);
  console.log(JSON.stringify({ ...result, output: undefined, usage: undefined }));
}
fs.mkdirSync("artifacts", { recursive: true });
const output = live
  ? "artifacts/creation-v2-live-evaluation.json"
  : "artifacts/creation-v2-evaluation-plan.json";
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      method:
        "2 × 2 model/prompt comparison; same workload effort and budget policy for both prompt arms. Synthetic fixtures only. Live results do not establish production accuracy.",
      results,
    },
    null,
    2,
  ),
);
console.log(output);
if (results.some((item) => item.errorCode || item.schemaValid === false)) process.exitCode = 1;
