import assert from "node:assert/strict";
import test from "node:test";
import { startChatDictation } from "./chat-dictation.ts";

function setup({ prefixed = false, startError = false } = {}) {
  let recognition;
  const transcripts = [];
  const listening = [];
  const errors = [];
  class FakeRecognition {
    stopped = false;
    aborted = false;
    constructor() { recognition = this; }
    start() { if (startError) throw new Error("Unavailable"); }
    stop() { this.stopped = true; }
    abort() { this.aborted = true; }
  }
  const browser = {
    navigator: { language: "en-US" },
    [prefixed ? "webkitSpeechRecognition" : "SpeechRecognition"]: FakeRecognition,
  };
  const callbacks = {
    onTranscript: (text) => transcripts.push(text),
    onListeningChange: (value) => listening.push(value),
    onError: (text) => errors.push(text),
  };
  const session = startChatDictation(browser, callbacks);
  return { recognition, session, transcripts, listening, errors, callbacks };
}

const result = (transcript, isFinal = true) => ({ 0: { transcript }, isFinal });

test("dictation appends final phrases once, including when WebKit replays earlier results", () => {
  const h = setup({ prefixed: true });
  assert.equal(h.recognition.continuous, true);
  assert.equal(h.recognition.lang, "en-US");
  h.recognition.onresult({ resultIndex: 0, results: [result("A wedding")] });
  h.recognition.onresult({ resultIndex: 0, results: [result("A wedding"), result("at the beach")] });
  h.recognition.onresult({ resultIndex: 2, results: [result("A wedding"), result("at the beach"), result("Sunday", false)] });
  assert.deepEqual(h.transcripts, ["A wedding", "at the beach"]);
});

test("finishing dictation accepts the final phrase before releasing listening state", () => {
  const h = setup();
  h.session.stop();
  assert.equal(h.recognition.stopped, true);
  assert.deepEqual(h.listening, [true]);
  h.recognition.onresult({ resultIndex: 0, results: [result("at six o'clock")] });
  h.recognition.onend();
  assert.deepEqual(h.transcripts, ["at six o'clock"]);
  assert.deepEqual(h.listening, [true, false]);
});

test("cancelling or leaving chat aborts dictation and ignores queued speech results", () => {
  const h = setup();
  const lateResult = h.recognition.onresult;
  h.session.cancel();
  h.session.cancel();
  lateResult({ resultIndex: 0, results: [result("Must not enter another chat")] });
  assert.equal(h.recognition.aborted, true);
  assert.equal(h.recognition.onresult, null);
  assert.deepEqual(h.transcripts, []);
  assert.deepEqual(h.listening, [true, false]);
});

test("microphone denial releases listening state and gives actionable guidance", () => {
  const h = setup();
  h.recognition.onerror({ error: "not-allowed" });
  assert.match(h.errors[0], /Microphone access was denied/);
  assert.deepEqual(h.listening, [true, false]);
  assert.equal(h.recognition.aborted, true);
});

test("unsupported browsers and synchronous start failures leave typing available", () => {
  const h = setup({ startError: true });
  assert.equal(h.session, null);
  assert.deepEqual(h.listening, [true, false]);
  assert.match(h.errors[0], /Unable to start/);
  assert.equal(startChatDictation({ navigator: { language: "en-US" } }, h.callbacks), null);
  assert.match(h.errors[1], /not supported/);
});
