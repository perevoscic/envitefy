import assert from "node:assert/strict";
import test from "node:test";
import { streamConciergePersona } from "./persona.ts";

const BASE_DRAFT = {
  intent: "create_event",
  creationSessionId: "session_test",
  requestedOutputs: ["live_card"],
  sourceContext: {
    type: "none",
    hasUsableContext: false,
    ambiguity: "none",
    detectedSourceIntent: "unknown",
    confidence: "low",
    signals: [],
    requiresUserConfirmation: false,
  },
  eventPurpose: "birthday party",
  eventType: "birthday",
  title: "Birthday party",
  ownership: "owned",
  draftStatus: "drafting",
  currentQuestion: "date",
  canPersist: true,
  honoreeName: null,
  relationship: null,
  ageOrMilestone: null,
  dateText: null,
  timeText: null,
  startISO: null,
  endISO: null,
  timezone: "America/Chicago",
  location: null,
  venue: null,
  theme: null,
  tone: null,
  outputs: ["live_card"],
  missingFields: ["date", "location"],
  previewCopy: {
    headline: "Birthday party",
    subheadline: "Details coming soon",
    body: "Join us for the guest of honor.",
    scheduleLine: "Date TBD",
    locationLine: "Location TBD",
    cta: "RSVP",
  },
  source: "text",
};

function withEnv(values, fn) {
  const keys = [
    "OPENAI_API_KEY",
    "OPENAI_CONCIERGE_PERSONA_TIMEOUT_MS",
    "OPENAI_CONCIERGE_STREAM_FIRST_TOKEN_TIMEOUT_MS",
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const key of keys) {
        if (previous[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = previous[key];
        }
      }
    });
}

test("persona streams deterministic fallback when no OpenAI key exists", async () => {
  const deltas = [];
  const result = await withEnv({}, () =>
    streamConciergePersona({
      message: "Create a birthday live card",
      chatMessages: [],
      draft: BASE_DRAFT,
      fallbackMessage: "When should this happen?",
      onDelta: (text) => deltas.push(text),
    }),
  );

  assert.deepEqual(deltas, ["When should this happen?"]);
  assert.equal(result.assistantMessage, "When should this happen?");
  assert.equal(result.usedAi, false);
});

test("persona preserves streamed token spacing", async () => {
  async function* streamChunks() {
    yield { choices: [{ delta: { content: "Beautiful" } }] };
    yield { choices: [{ delta: { content: ", when" } }] };
    yield { choices: [{ delta: { content: " should this happen?" } }] };
  }

  const deltas = [];
  const result = await withEnv({ OPENAI_API_KEY: "test-key" }, () =>
    streamConciergePersona(
      {
        message: "Create a birthday live card",
        chatMessages: [],
        draft: BASE_DRAFT,
        fallbackMessage: "When should this happen?",
        onDelta: (text) => deltas.push(text),
      },
      {
        createOpenAiClient: () => ({
          chat: {
            completions: {
              create: async () => streamChunks(),
            },
          },
        }),
      },
    ),
  );

  assert.deepEqual(deltas, ["Beautiful", ", when", " should this happen?"]);
  assert.equal(result.assistantMessage, "Beautiful, when should this happen?");
  assert.equal(result.usedAi, true);
});

test("persona falls back when first token times out", async () => {
  const deltas = [];
  const result = await withEnv(
    {
      OPENAI_API_KEY: "test-key",
      OPENAI_CONCIERGE_PERSONA_TIMEOUT_MS: "1",
      OPENAI_CONCIERGE_STREAM_FIRST_TOKEN_TIMEOUT_MS: "1",
    },
    () =>
      streamConciergePersona(
        {
          message: "Create a birthday live card",
          chatMessages: [],
          draft: BASE_DRAFT,
          fallbackMessage: "When should this happen?",
          onDelta: (text) => deltas.push(text),
        },
        {
          createOpenAiClient: () => ({
            chat: {
              completions: {
                create: async (_request, options) =>
                  new Promise((_resolve, reject) => {
                    options.signal.addEventListener("abort", () => reject(new Error("aborted")));
                  }),
              },
            },
          }),
        },
      ),
  );

  assert.deepEqual(deltas, ["When should this happen?"]);
  assert.equal(result.usedAi, false);
});
