import assert from "node:assert/strict";
import test from "node:test";
import { resolveConciergeOpenAiModel, resolveConciergeOpenAiTimeoutMs } from "./openai-config.ts";

const ENV_KEYS = [
  "OPENAI_CONCIERGE_MODEL",
  "CONCIERGE_FAST_MODEL_ENABLED",
  "OPENAI_CONCIERGE_FAST_MODEL",
  "OPENAI_CONCIERGE_TIMEOUT_MS",
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

test("concierge timeout defaults to 8000ms and accepts bounded overrides", () => {
  withEnv({}, () => {
    assert.equal(resolveConciergeOpenAiTimeoutMs(), 8000);
  });
  withEnv({ OPENAI_CONCIERGE_TIMEOUT_MS: "2500" }, () => {
    assert.equal(resolveConciergeOpenAiTimeoutMs(), 2500);
  });
});
