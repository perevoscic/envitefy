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
  numberOfGuests: null,
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

test("persona uses deterministic format prompt for starter categories", async () => {
  const deltas = [];
  let aiCalls = 0;
  const result = await withEnv({ OPENAI_API_KEY: "test-key" }, () =>
    streamConciergePersona(
      {
        message: "Birthday",
        chatMessages: [],
        draft: {
          ...BASE_DRAFT,
          requestedOutputs: [],
          outputs: [],
          currentQuestion: "honoreeName",
        },
        fallbackMessage:
          "Great, would you like that to be a Live Card, Flyer Invite, Event Page, or Invitation?",
        onDelta: (text) => deltas.push(text),
      },
      {
        createOpenAiClient: () => {
          aiCalls += 1;
          return null;
        },
      },
    ),
  );

  assert.equal(aiCalls, 0);
  assert.deepEqual(deltas, [
    "Great, would you like that to be a Live Card, Flyer Invite, Event Page, or Invitation?",
  ]);
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

test("persona strips markdown emphasis and star separators from confirmations", async () => {
  async function* streamChunks() {
    yield {
      choices: [
        {
          delta: {
            content: "Perfect - Honoree: ***Lara turning 7***\n***\nTime: **12:00 PM**",
          },
        },
      ],
    };
  }

  const deltas = [];
  const result = await withEnv({ OPENAI_API_KEY: "test-key" }, () =>
    streamConciergePersona(
      {
        message: "Lara 7 at noon",
        chatMessages: [],
        draft: BASE_DRAFT,
        fallbackMessage: "What kind of vibe should the invite have?",
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

  assert.equal(deltas.join(""), "Perfect - Honoree: Lara turning 7\n\nTime: 12:00 PM");
  assert.equal(result.assistantMessage, "Perfect - Honoree: Lara turning 7\n\nTime: 12:00 PM");
});

test("persona does not expose default timezone copy", async () => {
  async function* streamChunks() {
    yield {
      choices: [
        {
          delta: {
            content:
              "Wonderful - I'll draft a birthday live card plus an RSVP page in America/Chicago time.",
          },
        },
      ],
    };
    yield { choices: [{ delta: { content: "\nWho is the honoree?" } }] };
  }

  const deltas = [];
  let requestPayload = null;
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
              create: async (request) => {
                requestPayload = request;
                return streamChunks();
              },
            },
          },
        }),
      },
    ),
  );

  assert.doesNotMatch(JSON.stringify(requestPayload?.messages?.at(-1) || null), /timezone/i);
  assert.doesNotMatch(JSON.stringify(requestPayload?.messages?.at(-1) || null), /America\/Chicago/);
  assert.match(
    requestPayload?.messages?.[0]?.content || "",
    /Never mention default or IANA timezone/,
  );
  assert.doesNotMatch(deltas.join(""), /America\/Chicago|in America\/Chicago time/);
  assert.doesNotMatch(result.assistantMessage, /America\/Chicago|in America\/Chicago time/);
  assert.equal(
    result.assistantMessage,
    "Wonderful - I'll draft a birthday live card plus an RSVP page.\nWho is the honoree?",
  );
});

test("persona receives bounded weather context for forecast questions", async () => {
  async function* streamChunks() {
    yield {
      choices: [
        {
          delta: {
            content:
              "The forecast near Sky Zone for the event time is Partly cloudy, about 73°F. I can add a rain backup note if you want one.",
          },
        },
      ],
    };
  }

  let requestPayload = null;
  const eventIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const result = await withEnv({ OPENAI_API_KEY: "test-key" }, () =>
    streamConciergePersona(
      {
        message: "What will the weather be like?",
        chatMessages: [],
        draft: {
          ...BASE_DRAFT,
          startISO: eventIso,
          location: "Sky Zone",
          missingFields: [],
        },
        fallbackMessage: "I can check once I have the date and place.",
        weatherContext: {
          status: "available",
          location: "Sky Zone",
          eventIso,
          summary: "Partly cloudy",
          tempF: 73,
          checkedAt: "2026-05-05T12:00:00.000Z",
          source: "weatherapi",
          message: "The forecast near Sky Zone for the event time is Partly cloudy, about 73°F.",
        },
        onDelta: () => {},
      },
      {
        createOpenAiClient: () => ({
          chat: {
            completions: {
              create: async (request) => {
                requestPayload = request;
                return streamChunks();
              },
            },
          },
        }),
      },
    ),
  );

  assert.match(
    requestPayload?.messages?.[0]?.content || "",
    /use only the supplied weatherContext/,
  );
  assert.match(JSON.stringify(requestPayload?.messages?.at(-1) || null), /weatherContext/);
  assert.match(result.assistantMessage, /Partly cloudy/);
  assert.doesNotMatch(result.assistantMessage, /probably|likely|I guess/i);
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
