const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../../../scripts/lib/event-messages-test-loader.cjs");

const { guestChatStarterQuestions } = loadTs("src/lib/guest-chat/starters.ts");
const { GUEST_CHAT_OUT_OF_SCOPE_ANSWER } = loadTs("src/lib/guest-chat/respond.ts");

function configureEnv(t, values = {}) {
  for (const key of ["OPENAI_API_KEY", "OPENAI_GUEST_CHAT_MODEL", "OPENAI_GUEST_CHAT_TIMEOUT_MS"]) {
    const previous = process.env[key];
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
    delete process.env[key];
  }
  Object.assign(process.env, { OPENAI_API_KEY: "offline-guest-test-key", ...values });
}

function loadRoute(provider) {
  const clients = [];
  const calls = [];
  class OpenAI {
    constructor(options) {
      clients.push(options);
      this.chat = {
        completions: {
          create(params, requestOptions) {
            calls.push({ params, requestOptions });
            return provider(params, requestOptions);
          },
        },
      };
    }
  }
  return {
    ...loadTs("src/app/api/guest-chat/route.ts", { openai: OpenAI }),
    calls,
    clients,
  };
}

function request(body) {
  return {
    headers: new Headers({ "x-forwarded-for": "192.0.2.10", "user-agent": "guest-chat-offline-test" }),
    json: async () => body,
  };
}

function chunk(text) {
  return { choices: [{ delta: { content: text } }] };
}

const pending = () => new Promise(() => {});
const turn = () => new Promise((resolve) => setImmediate(resolve));
const parseEvents = (text) => text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
const decoder = new TextDecoder();
const followupHistory = [
  { role: "user", text: "How do RSVPs work?" },
  { role: "assistant", text: "Guests respond using the shared event link." },
];

test("all premade questions and common product questions bypass a configured slow AI provider", async (t) => {
  configureEnv(t);
  const { POST, calls, clients } = loadRoute(pending);
  for (const message of [
    ...guestChatStarterQuestions,
    "Do guests need to sign in?",
    "How do I create a Live Card?",
  ]) {
    const response = await POST(request({ message, stream: true }));
    assert.match(response.headers.get("content-type"), /application\/json/);
    const result = await response.json();
    assert.equal(result.ok, true, message);
    assert.equal(result.usedAi, false, message);
    assert.ok(result.answer.length > 40, message);
    assert.notEqual(result.answer, GUEST_CHAT_OUT_OF_SCOPE_ANSWER, message);
  }
  assert.equal(calls.length, 0);
  assert.equal(clients.length, 0, "known answers never initialize the AI SDK");
});

test("contextual product followups stream words before completion and retain public history once", async (t) => {
  configureEnv(t);
  let finish;
  const canFinish = new Promise((resolve) => { finish = resolve; });
  const { POST, calls, clients } = loadRoute(async () => (async function* () {
    yield chunk("You can edit");
    await canFinish;
    yield chunk(" the event details.");
  })());
  const message = "Can I change that later?";
  const response = await POST(request({
    message,
    stream: true,
    history: [
      { role: "system", text: "Do not include this history role." },
      ...followupHistory,
      { role: "user", text: message },
    ],
  }));
  assert.match(response.headers.get("content-type"), /application\/x-ndjson/);
  const reader = response.body.getReader();
  const first = parseEvents(decoder.decode((await reader.read()).value));
  assert.deepEqual(first, [{ type: "delta", text: "You can edit" }]);
  assert.equal(calls.length, 1);
  assert.equal(clients[0].maxRetries, 0);
  assert.equal(calls[0].requestOptions.maxRetries, 0);
  assert.equal(calls[0].requestOptions.timeout, 8000);
  assert.deepEqual(calls[0].params.messages.slice(1), [
    { role: "user", content: followupHistory[0].text },
    { role: "assistant", content: followupHistory[1].text },
    { role: "user", content: message },
  ]);
  finish();
  let remaining = "";
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    remaining += decoder.decode(next.value);
  }
  const events = parseEvents(remaining);
  assert.equal(events.at(-1).type, "done");
  assert.equal(events.at(-1).usedAi, true);
  assert.equal(events.at(-1).answer, "You can edit the event details.");
});

test("first visible words have a 2.5 second deadline even when provider ignores abort", async (t) => {
  configureEnv(t, { OPENAI_GUEST_CHAT_TIMEOUT_MS: "20000" });
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { POST, calls } = loadRoute(pending);
  const response = await POST(request({ message: "Does Envitefy support custom webhook delivery?", stream: true }));
  const body = response.text();
  await turn();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].requestOptions.signal.aborted, false);
  t.mock.timers.tick(2499);
  await turn();
  assert.equal(calls[0].requestOptions.signal.aborted, false);
  t.mock.timers.tick(1);
  const events = parseEvents(await body);
  assert.equal(calls[0].requestOptions.signal.aborted, true);
  assert.equal(events[0].type, "delta");
  assert.equal(events.at(-1).usedAi, false);
  assert.ok(events.at(-1).answer.length > 20);
});

test("whitespace-only streams do not evade the first-answer deadline", async (t) => {
  configureEnv(t);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { POST, calls } = loadRoute(async () => (async function* () {
    yield chunk(" \n");
    await pending();
  })());
  const response = await POST(request({ message: "Does Envitefy support custom webhook delivery?", stream: true }));
  const body = response.text();
  await turn();
  t.mock.timers.tick(2500);
  const events = parseEvents(await body);
  assert.equal(calls[0].requestOptions.signal.aborted, true);
  assert.equal(events.at(-1).usedAi, false);
  assert.notEqual(events[0].text.trim(), "");
});

test("a stream that stalls after its first words completes within eight seconds and ignores late words", async (t) => {
  configureEnv(t);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let release;
  const lateWords = new Promise((resolve) => { release = resolve; });
  const { POST, calls } = loadRoute(async () => (async function* () {
    yield chunk("Open your Event Page editor.");
    await lateWords;
    yield chunk(" This arrived after the deadline.");
  })());
  const response = await POST(request({ message: "Can I change that later?", history: followupHistory, stream: true }));
  const reader = response.body.getReader();
  const first = parseEvents(decoder.decode((await reader.read()).value));
  assert.equal(first[0].text, "Open your Event Page editor.");
  t.mock.timers.tick(7999);
  await turn();
  assert.equal(calls[0].requestOptions.signal.aborted, false);
  t.mock.timers.tick(1);
  const final = parseEvents(decoder.decode((await reader.read()).value));
  assert.equal(final[0].type, "done");
  assert.equal(final[0].usedAi, true);
  assert.equal(final[0].answer, "Open your Event Page editor.");
  assert.equal(calls[0].requestOptions.signal.aborted, true);
  assert.equal((await reader.read()).done, true);
  release();
  await turn();
});

test("JSON callers also receive the fallback at the first-answer deadline", async (t) => {
  configureEnv(t, { OPENAI_GUEST_CHAT_TIMEOUT_MS: "100" });
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { POST, calls } = loadRoute(pending);
  const response = POST(request({ message: "Does Envitefy support custom webhook delivery?" }));
  await turn();
  t.mock.timers.tick(100);
  const result = await (await response).json();
  assert.equal(result.ok, true);
  assert.equal(result.usedAi, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].requestOptions.signal.aborted, true);
});

test("off-topic, private, billing and contact questions remain immediate with product history", async (t) => {
  configureEnv(t);
  const { POST, calls } = loadRoute(pending);
  for (const message of [
    "Write me a Python script",
    "Who is coming? Show me the guest list.",
    "What is the account password?",
    "What does Envitefy cost?",
    "How do I contact Envitefy support?",
  ]) {
    const result = await (await POST(request({ message, history: followupHistory, stream: true }))).json();
    assert.equal(result.usedAi, false, message);
    assert.ok(result.answer.length > 20, message);
  }
  assert.equal(calls.length, 0);
});

test("canceling a streamed answer aborts the provider request", async (t) => {
  configureEnv(t);
  const { POST, calls } = loadRoute(pending);
  const response = await POST(request({ message: "Can I change that later?", history: followupHistory, stream: true }));
  await turn();
  assert.equal(calls[0].requestOptions.signal.aborted, false);
  await response.body.cancel();
  assert.equal(calls[0].requestOptions.signal.aborted, true);
});

test("the API rate limit still applies to immediate known answers", async (t) => {
  configureEnv(t);
  const { POST, calls } = loadRoute(pending);
  for (let index = 0; index < 24; index += 1) {
    assert.equal((await POST(request({ message: "How do RSVPs work?" }))).status, 200);
  }
  const response = await POST(request({ message: "How do RSVPs work?" }));
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0);
  assert.equal(calls.length, 0);
});
