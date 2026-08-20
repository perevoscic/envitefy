import assert from "node:assert/strict";
import test from "node:test";
import {
  openAiChatTemperatureParam,
  resolveConciergeOpenAiChatModel,
  resolveConciergeOpenAiExtractionModel,
  resolveConciergeOpenAiModel,
  resolveConciergeOpenAiPersonaModel,
  resolveConciergeOpenAiPlannerModel,
  resolveConciergeOpenAiPremiumModel,
  resolveConciergeOpenAiPersonaTimeoutMs,
  resolveConciergeOpenAiTimeoutMs,
  resolveConciergeStreamFirstTokenTimeoutMs,
} from "./openai-config.ts";

const ENV_KEYS = [
  "OPENAI_CONCIERGE_MODEL",
  "OPENAI_CONCIERGE_CHAT_MODEL",
  "OPENAI_CONCIERGE_EXTRACTION_MODEL",
  "OPENAI_CONCIERGE_PLANNER_MODEL",
  "OPENAI_CONCIERGE_PREMIUM_MODEL",
  "OPENAI_CONCIERGE_SIMPLE_ACTION_MODEL",
  "CONCIERGE_FAST_MODEL_ENABLED",
  "OPENAI_CONCIERGE_FAST_MODEL",
  "OPENAI_CONCIERGE_TIMEOUT_MS",
  "OPENAI_CONCIERGE_PERSONA_MODEL",
  "OPENAI_CONCIERGE_PERSONA_TIMEOUT_MS",
  "OPENAI_CONCIERGE_STREAM_FIRST_TOKEN_TIMEOUT_MS",
];

function withEnv(values, fn) {
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
  }
}

test("concierge extraction/planning base model defaults to GPT-5.6 Terra", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiModel(), "gpt-5.6-terra");
  });
});

test("concierge fast model flag uses GPT-5.6 Luna", () => {
  withEnv({ CONCIERGE_FAST_MODEL_ENABLED: "1" }, () => {
    assert.equal(resolveConciergeOpenAiModel(), "gpt-5.6-luna");
  });
});

test("explicit concierge model wins over fast model flag", () => {
  withEnv(
    {
      OPENAI_CONCIERGE_MODEL: "gpt-custom",
      CONCIERGE_FAST_MODEL_ENABLED: "1",
      OPENAI_CONCIERGE_FAST_MODEL: "gpt-fast-custom",
    },
    () => {
      assert.equal(resolveConciergeOpenAiModel(), "gpt-custom");
    },
  );
});

test("configured fast model wins when fast model flag is enabled", () => {
  withEnv(
    {
      CONCIERGE_FAST_MODEL_ENABLED: "1",
      OPENAI_CONCIERGE_FAST_MODEL: "gpt-fast-custom",
    },
    () => {
      assert.equal(resolveConciergeOpenAiModel(), "gpt-fast-custom");
    },
  );
});

test("concierge chat model defaults to GPT-5.6 Luna and supports a separate override", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiChatModel(), "gpt-5.6-luna");
  });
  withEnv({ OPENAI_CONCIERGE_CHAT_MODEL: "gpt-chat-custom" }, () => {
    assert.equal(resolveConciergeOpenAiChatModel(), "gpt-chat-custom");
  });
});

test("concierge premium model defaults to GPT-5.6 Sol and supports a separate override", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiPremiumModel(), "gpt-5.6-sol");
  });
  withEnv({ OPENAI_CONCIERGE_PREMIUM_MODEL: "gpt-premium-custom" }, () => {
    assert.equal(resolveConciergeOpenAiPremiumModel(), "gpt-premium-custom");
  });
});

test("concierge extraction routes normal work to Terra and premium work to Sol", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiExtractionModel(), "gpt-5.6-terra");
    assert.equal(resolveConciergeOpenAiExtractionModel({ premium: true }), "gpt-5.6-sol");
  });
  withEnv({ OPENAI_CONCIERGE_EXTRACTION_MODEL: "gpt-extract-custom" }, () => {
    assert.equal(resolveConciergeOpenAiExtractionModel({ premium: true }), "gpt-extract-custom");
  });
});

test("concierge planner routes simple work to Luna, base work to Terra, and premium work to Sol", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiPlannerModel({ simple: true }), "gpt-5.6-luna");
    assert.equal(resolveConciergeOpenAiPlannerModel(), "gpt-5.6-terra");
    assert.equal(resolveConciergeOpenAiPlannerModel({ premium: true }), "gpt-5.6-sol");
  });
  withEnv({ OPENAI_CONCIERGE_SIMPLE_ACTION_MODEL: "gpt-simple-custom" }, () => {
    assert.equal(resolveConciergeOpenAiPlannerModel({ simple: true }), "gpt-simple-custom");
  });
});

test("concierge timeout defaults to 10000ms and accepts bounded overrides", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiTimeoutMs(), 10000);
  });
  withEnv({ OPENAI_CONCIERGE_TIMEOUT_MS: "2500" }, () => {
    assert.equal(resolveConciergeOpenAiTimeoutMs(), 2500);
  });
});

test("GPT-5.6 chat requests preserve role-specific reasoning and omit custom temperature", () => {
  assert.deepEqual(openAiChatTemperatureParam("gpt-5.6-sol", 0.1), {});
  assert.deepEqual(openAiChatTemperatureParam("gpt-5.6-terra", 0.55), {
    reasoning_effort: "none",
  });
  assert.deepEqual(openAiChatTemperatureParam("gpt-5.6-luna", 0.55), {
    reasoning_effort: "none",
  });
  assert.deepEqual(openAiChatTemperatureParam("gpt-4.1", 0.1), { temperature: 0.1 });
});

test("concierge persona model defaults to base reasoning model", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiPersonaModel(), "gpt-5.6-terra");
  });
  withEnv({ OPENAI_CONCIERGE_PERSONA_MODEL: "gpt-persona-custom" }, () => {
    assert.equal(resolveConciergeOpenAiPersonaModel(), "gpt-persona-custom");
  });
});

test("concierge persona streaming timeouts leave room for reasoning and accept overrides", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiPersonaTimeoutMs(), 5000);
    assert.equal(resolveConciergeStreamFirstTokenTimeoutMs(), 5000);
  });
  withEnv(
    {
      OPENAI_CONCIERGE_PERSONA_TIMEOUT_MS: "900",
      OPENAI_CONCIERGE_STREAM_FIRST_TOKEN_TIMEOUT_MS: "1100",
    },
    () => {
      assert.equal(resolveConciergeOpenAiPersonaTimeoutMs(), 900);
      assert.equal(resolveConciergeStreamFirstTokenTimeoutMs(), 1100);
    },
  );
});
