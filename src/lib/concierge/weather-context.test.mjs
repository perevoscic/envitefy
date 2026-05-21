import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveConciergeWeatherContextFromDraft,
  resolveConciergeWeatherContextFromEvent,
  shouldResolveConciergeWeatherContext,
} from "./weather-context.ts";

function draft(overrides = {}) {
  return {
    startISO: null,
    location: null,
    venue: null,
    ...overrides,
  };
}

function withEnv(values, fn) {
  const keys = ["WEATHERAPI_KEY", "WEATHERAPI_API_KEY"];
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

test("weather intent only triggers for forecast-like questions", () => {
  assert.equal(shouldResolveConciergeWeatherContext("Will rain be an issue?"), true);
  assert.equal(shouldResolveConciergeWeatherContext("Make it elegant"), false);
});

test("draft weather context asks for event timing for event-specific questions", async () => {
  const context = await resolveConciergeWeatherContextFromDraft({
    message: "What will the weather be like that day?",
    draft: draft({ location: "Sky Zone" }),
  });

  assert.equal(context?.status, "missing_event_details");
  assert.match(context?.message || "", /date and time/);
  assert.equal(context?.summary, null);
  assert.equal(context?.tempF, null);
});

test("draft weather context uses draft location for today questions", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = null;
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    const target = new Date();
    target.setHours(12, 0, 0, 0);
    return {
      ok: true,
      json: async () => ({
        forecast: {
          forecastday: [
            {
              hour: [
                {
                  time_epoch: Math.round(target.getTime() / 1000),
                  temp_f: 81,
                  condition: { text: "Sunny" },
                },
              ],
            },
          ],
        },
      }),
    };
  };

  try {
    await withEnv({ WEATHERAPI_KEY: "test-key" }, async () => {
      const context = await resolveConciergeWeatherContextFromDraft({
        message: "How will the weather be today?",
        draft: draft({
          startISO: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Austin, TX",
        }),
      });

      assert.equal(context?.status, "available");
      assert.equal(context?.location, "Austin, TX");
      assert.equal(new URL(requestedUrl).searchParams.get("q"), "Austin, TX");
      assert.doesNotMatch(context?.message || "", /what city/i);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("draft weather context uses venue when location is missing", async () => {
  const context = await withEnv({}, () =>
    resolveConciergeWeatherContextFromDraft({
      message: "What is the weather today?",
      draft: draft({ venue: "Sky Zone" }),
    }),
  );

  assert.equal(context?.status, "unconfigured");
  assert.equal(context?.location, "Sky Zone");
  assert.doesNotMatch(context?.message || "", /what city/i);
});

test("draft weather context asks exactly for a city when no location exists", async () => {
  const context = await resolveConciergeWeatherContextFromDraft({
    message: "What is the weather today?",
    draft: draft(),
  });

  assert.equal(context?.status, "missing_location");
  assert.equal(context?.message, "Sure, what city should I check?");
});

test("event weather context reports forecast window limits", async () => {
  const context = await resolveConciergeWeatherContextFromEvent({
    message: "Will it be hot outside?",
    eventData: {
      startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Austin, TX",
    },
  });

  assert.equal(context?.status, "outside_forecast_window");
  assert.match(context?.message || "", /within three days/);
});

test("event weather context can read WeatherAPI forecast payloads", async () => {
  const originalFetch = globalThis.fetch;
  const target = new Date(Date.now() + 24 * 60 * 60 * 1000);
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      forecast: {
        forecastday: [
          {
            hour: [
              {
                time_epoch: Math.round(target.getTime() / 1000),
                temp_f: 73,
                condition: { text: "Partly cloudy" },
              },
            ],
          },
        ],
      },
    }),
  });

  try {
    await withEnv({ WEATHERAPI_KEY: "test-key" }, async () => {
      const context = await resolveConciergeWeatherContextFromEvent({
        message: "What is the forecast?",
        eventData: {
          startAt: target.toISOString(),
          location: "Austin, TX",
        },
      });

      assert.equal(context?.status, "available");
      assert.equal(context?.summary, "Partly cloudy");
      assert.equal(context?.tempF, 73);
      assert.match(context?.message || "", /Partly cloudy, about 73°F/);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
