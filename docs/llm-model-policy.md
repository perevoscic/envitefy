# LLM model policy and evaluation

The compatibility adapter supports GPT-6 Astra, GPT-6.1 Sol, GPT-6 Sol and GPT-6 Luna, including dated model IDs. Existing model defaults and environment-variable precedence are preserved. A newer model is a benchmark candidate until representative task results support changing a default.

## Model selection

`src/lib/openai-model-policy.ts` holds shared model roles. Concierge, OCR and Studio resolve their defaults from this registry; their existing environment overrides still win.

| Role | Default | Candidate |
| --- | --- | --- |
| Fast classification, OCR and help chat | GPT-5.6 Luna | GPT-6 Luna |
| Balanced extraction/planning | GPT-5.6 Terra | GPT-6.1 Sol |
| Difficult evidence and visual checks | GPT-6 Astra | GPT-6 Astra |
| Studio creative planning | GPT-6 Astra | GPT-6.1 Sol |
| Image generation | GPT Image 2.5 Flare | GPT Image 2.5 Flare |
| Precise image edits | GPT Image 2.5 Flare | GPT Image 2.5 Sunburst |

Compare precise edits by explicitly setting `STUDIO_OPENAI_IMAGE_EDIT_MODEL=gpt-image-2.5-sunburst` in a test environment. This does not change the background-generation model. Retain the isolated lettering layer and existing background-preservation checks.

## Reasoning and request budgets

`src/lib/openai-chat-params.ts` delegates model-family capabilities to the shared registry. Astra and GPT-6.1 Sol require reasoning; an explicit unsupported `none` raises an error before a request. GPT-6 Luna retains non-reasoning behavior for efficient workloads. GPT-6 Sol defaults to medium reasoning. Reasoning model requests omit custom temperature. Unrecognized GPT-5/GPT-6 reasoning families do not inherit legacy temperature settings.

`src/lib/creation/openai-workloads.ts` defines classification, transcription, extraction, correction, creative planning, visual checking and guest-chat budgets. Reasoning models receive low effort for bounded work, medium for creative planning, and output headroom for reasoning tokens. Guest chat retains its 320-token fast-model cap; a reasoning-model override receives a larger total budget. Existing concise-answer instructions and first-token/total deadlines remain active.

Document transcription uses strict JSON schemas and at most two page images per request. Its completion budget scales with page count. A truncated two-page batch may split into single-page requests, retaining the original deadline, page order and cancellation signal. Refusal, malformed output and single-page truncation fail without automatic retries. All accepted document pages must be accounted for.

Gymnastics/practice image extractors use Chat Completions `image_url` parts. Missing or invalid meet dates remain null; the schedule adapter keeps those rows available for correction. An all-day event with a valid date may derive its exclusive next-day calendar boundary; timed events do not receive an invented end time.

## Measurement

`creation_model_run` records the prompt/policy versions, validated outcome, model, workload, elapsed time, provider request ID and input/output/cached/reasoning token counts. Unknown usage remains null. Source transcripts, contacts and generated wording are excluded. These are per-call measurements; they are not a claim of total workflow or image-generation cost.

## Evaluation commands

Run offline regression checks:

```sh
npm run test:ai-models
bun test src/lib/create/read-source.test.ts
```

Create a comparison plan with no provider calls:

```sh
npm run eval:creation -- --models=gpt-5.6-luna,gpt-6-luna,gpt-6.1-sol
```

Explicitly run a bounded live smoke comparison:

```sh
npm run eval:creation -- --live --smoke --models=gpt-6-luna,gpt-6.1-sol --max-calls=2
```

The ten built-in synthetic cases cover missing/invalid dates, ambiguous ages, medical roles, organizer/venue separation, complete links, multilingual negations and instruction injection. Schema validity and factual checks are scored separately. These cases provide regression coverage, not proof of production accuracy or visual quality.

Use `--dataset=path/to/cases.json` for a curated fixture array with the same structure as `scripts/fixtures/creation-evaluation.json`. Extraction fixtures may supply `imagePath` relative to the dataset file instead of, or alongside, `sourceText`. PNG, JPEG and WebP images up to 8 MB are accepted. Images are read and sent only in explicit live runs. Use representative multi-page imports, languages and actual failure cases with human-reviewed expected fields before changing defaults.

`--repeats=3` repeats each case; `--prompts=legacy,v2` compares both creative prompt versions. Extraction has only the current prompt arm. `--max-calls` rejects an oversized live plan before credentials are loaded. Access/quota failures stop the run and mark the comparison incomplete. Results have unique timestamped filenames under `artifacts/creation-evaluation/`; `--output=...` selects an explicit destination. Generated responses are omitted unless `--include-output` is supplied.

Summaries report schema/factual pass rates, failed requests, p50/p95 latency and optional estimated cost per passing result. To supply cost rates, use `--pricing=path/to/pricing.json` with model IDs mapped to `input`, `cachedInput` and `output` USD-per-million-token rates verified for the run date. Missing usage, missing rates and unpriced cache-write usage yield null costs. Estimates cover text-model requests, including vision inputs, and exclude image generation and other workflow stages.

The scorer and compatibility regressions also run in the existing Create fact-integrity CI suite. Live comparisons remain explicit; CI makes no paid provider calls.

## Official references

- [Current model and migration guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [GPT-6 Luna reasoning settings](https://developers.openai.com/api/docs/models/gpt-6-luna)
- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Image model selection](https://developers.openai.com/api/docs/guides/image-generation)
- [Evaluation design](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
