import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveConciergeOpenAiModel,
  resolveConciergeOpenAiPersonaModel,
  resolveConciergeOpenAiPersonaTimeoutMs,
  resolveConciergeOpenAiTimeoutMs,
  resolveConciergeStreamFirstTokenTimeoutMs,
} from "./openai-config.ts";

const ENV_KEYS = [
  "OPENAI_CONCIERGE_MODEL",
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

test("concierge model defaults to mini without fast model flag", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiModel(), "gpt-5.4-mini");
  });
});

test("concierge fast model flag uses nano fallback", () => {
  withEnv({ CONCIERGE_FAST_MODEL_ENABLED: "1" }, () => {
    assert.equal(resolveConciergeOpenAiModel(), "gpt-5.4-nano");
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

test("concierge timeout defaults to 3000ms and accepts bounded overrides", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiTimeoutMs(), 3000);
  });
  withEnv({ OPENAI_CONCIERGE_TIMEOUT_MS: "2500" }, () => {
    assert.equal(resolveConciergeOpenAiTimeoutMs(), 2500);
  });
});

test("concierge persona model defaults to the fast model family", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiPersonaModel(), "gpt-5.4-nano");
  });
  withEnv({ OPENAI_CONCIERGE_PERSONA_MODEL: "gpt-persona-custom" }, () => {
    assert.equal(resolveConciergeOpenAiPersonaModel(), "gpt-persona-custom");
  });
});

test("concierge persona streaming timeouts have tight defaults and accept overrides", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiPersonaTimeoutMs(), 1200);
    assert.equal(resolveConciergeStreamFirstTokenTimeoutMs(), 1500);
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
