const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");
const { requestGuestChatAnswer } = loadTs("src/lib/guest-chat/client.ts");

const params = { message: "How do RSVPs work?", history: [{ role: "user", text: "How do RSVPs work?" }] };
const encode = (text) => new TextEncoder().encode(text);
const event = (data) => `${JSON.stringify(data)}\n`;
const ndjson = (chunks) => new Response(new ReadableStream({
  start(controller) {
    for (const chunk of chunks) controller.enqueue(typeof chunk === "string" ? encode(chunk) : chunk);
    controller.close();
  },
}), { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json" },
});
const options = (response) => ({ fetchImpl: async () => response });
const deadlines = { firstResponseTimeoutMs: 30, inactivityTimeoutMs: 30, totalTimeoutMs: 100 };
const never = () => new Promise(() => {});

test("requests streaming and preserves JSON answer metadata", async () => {
  let request;
  const answer = await requestGuestChatAnswer(params, {
    fetchImpl: async (url, init) => {
      request = { url, init };
      return json({ ok: true, answer: "Guests open your shared link.", signupSuggested: true, handoffSuggested: false });
    },
  });
  assert.equal(request.url, "/api/guest-chat");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.credentials, "include");
  assert.deepEqual(JSON.parse(request.init.body), { ...params, stream: true });
  assert.deepEqual(answer, { answer: "Guests open your shared link.", signupSuggested: true, handoffSuggested: false });
});

test("streams chunked Unicode deltas and uses the authoritative final answer", async () => {
  const body = encode(event({ type: "delta", text: "RSVP 🎉" }) + event({ type: "delta", text: " at the link." }) + JSON.stringify({
    type: "done", ok: true, answer: "RSVP 🎉 at your event link.", signupSuggested: false, handoffSuggested: true,
  }));
  const chunks = Array.from(body, (byte) => new Uint8Array([byte]));
  const deltas = [];
  const answer = await requestGuestChatAnswer({ ...params, onDelta: (text) => deltas.push(text) }, options(ndjson(chunks)));
  assert.deepEqual(deltas, ["RSVP 🎉", " at the link."]);
  assert.deepEqual(answer, { answer: "RSVP 🎉 at your event link.", signupSuggested: false, handoffSuggested: true });
});

test("accepts final-only done events with and without a trailing newline", async () => {
  const final = { type: "done", ok: true, answer: "Open the RSVP button.", handoffSuggested: false };
  for (const line of [JSON.stringify(final), event(final)]) {
    const answer = await requestGuestChatAnswer(params, options(ndjson([line])));
    assert.deepEqual(answer, { answer: final.answer, handoffSuggested: false });
  }
});

test("rejects empty, malformed, failed, and truncated streams", async () => {
  const cases = [
    [],
    ["\n\r\n"],
    ["{broken json}\n"],
    [event({ type: "delta", text: 123 })],
    [event({ type: "unknown" })],
    [event({ type: "delta", text: "Partial answer" })],
    [event({ type: "done", ok: true, answer: "  " })],
    [event({ type: "done", ok: false, error: "Please try again later." })],
    [event({ type: "error", error: "Please try again later." })],
  ];
  for (const chunks of cases) await assert.rejects(requestGuestChatAnswer(params, options(ndjson(chunks))));
});

test("preserves HTTP errors and rejects empty JSON answers", async () => {
  await assert.rejects(requestGuestChatAnswer(params, options(json({ ok: false, error: "Too many messages." }, 429))), /Too many messages/);
  await assert.rejects(requestGuestChatAnswer(params, options(json({ ok: true, answer: "" }))), /temporarily unavailable/);
});

test("normalizes malformed JSON and HTML error responses for guests", async () => {
  for (const status of [200, 502]) {
    const response = new Response("<html>Bad gateway</html>", { status, headers: { "Content-Type": "text/html" } });
    await assert.rejects(requestGuestChatAnswer(params, options(response)), {
      name: "Error",
      message: "Envitefy Concierge is temporarily unavailable. Please try again.",
    });
  }
});

test("bounds stalled fetch headers even when fetch ignores abort", async () => {
  let signal;
  await assert.rejects(requestGuestChatAnswer(params, {
    ...deadlines,
    fetchImpl: async (_, init) => { signal = init.signal; return never(); },
  }), /too long/);
  assert.equal(signal.aborted, true);
});

test("bounds a stalled JSON body", async () => {
  await assert.rejects(requestGuestChatAnswer(params, {
    ...deadlines,
    fetchImpl: async () => ({ ok: true, headers: new Headers({ "Content-Type": "application/json" }), json: never }),
  }), /too long/);
});

test("bounds a stream that never yields its first answer", async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({ cancel() { cancelled = true; } }), {
    headers: { "Content-Type": "application/x-ndjson" },
  });
  await assert.rejects(requestGuestChatAnswer(params, { ...deadlines, ...options(response) }), /too long/);
  assert.equal(cancelled, true);
});

test("bounds inactivity after a partial answer and preserves received deltas", async () => {
  const deltas = [];
  const response = new Response(new ReadableStream({
    start(controller) { controller.enqueue(encode(event({ type: "delta", text: "Open the RSVP button." }))); },
  }), { headers: { "Content-Type": "application/x-ndjson" } });
  await assert.rejects(requestGuestChatAnswer({ ...params, onDelta: (text) => deltas.push(text) }, {
    ...deadlines,
    firstResponseTimeoutMs: 100,
    ...options(response),
  }), /too long/);
  assert.deepEqual(deltas, ["Open the RSVP button."]);
});

test("total deadline bounds streams that keep sending text", async () => {
  let interval;
  const response = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(encode(event({ type: "delta", text: "RSVP " })));
      interval = setInterval(() => controller.enqueue(encode(event({ type: "delta", text: "more " }))), 10);
    },
    cancel() { clearInterval(interval); },
  }), { headers: { "Content-Type": "application/x-ndjson" } });
  await assert.rejects(requestGuestChatAnswer(params, {
    firstResponseTimeoutMs: 200,
    inactivityTimeoutMs: 200,
    totalTimeoutMs: 45,
    ...options(response),
  }), /too long/);
});

test("caller cancellation interrupts a stalled request", async () => {
  const controller = new AbortController();
  const pending = requestGuestChatAnswer(params, { signal: controller.signal, fetchImpl: never });
  controller.abort(new Error("Chat closed."));
  await assert.rejects(pending, /Chat closed/);
});

test("preserves caller cancellation while reading a JSON body", async () => {
  const controller = new AbortController();
  let onReading;
  const reading = new Promise((resolve) => { onReading = resolve; });
  const pending = requestGuestChatAnswer(params, {
    signal: controller.signal,
    fetchImpl: async () => ({
      ok: true,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: () => { onReading(); return never(); },
    }),
  });
  await reading;
  controller.abort(new Error("Chat closed."));
  await assert.rejects(pending, /Chat closed/);
});
