import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveOcrBirthdayTitle } from "./birthday-age.ts";
import { buildEventExtractionPrompt } from "./prompts.ts";

const title = "Ava's Birthday Party — Pool Bash";

test("birthday OCR does not turn unrelated flyer numbers into an age", () => {
  for (const text of [
    "October 24 at 3 PM. Admission $7. 14 Main Street. Call 555-123-4567.",
    "Saturday the 7th. Jersey number 10. RSVP by the 3rd.",
    "7\nAva's Birthday Party\nBring socks",
    "Ages 7–12 welcome. Children age 7+ may attend.",
    "Celebrating 7 years of friendship",
  ]) {
    assert.deepEqual(resolveOcrBirthdayTitle({ title, text }), { title, ageOrdinal: "" }, text);
  }
});

test("birthday OCR preserves supported age and the printed party theme", () => {
  for (const text of [
    "Ava turns 7. October 24 at 3 PM. Admission $10.",
    "Ava is turning\n7",
    "Celebrating Ava's 7th birthday",
    "Ava is 7 years old",
  ]) {
    assert.deepEqual(resolveOcrBirthdayTitle({ title, text }), {
      title: "Ava's 7th Birthday Party — Pool Bash",
      ageOrdinal: "7th",
    });
  }
});

test("an explicitly unknown model age is not reconstructed from generated copy", () => {
  assert.deepEqual(
    resolveOcrBirthdayTitle({
      title: "Ava's 7th Birthday Party — Pool Bash",
      text: "Join us for Ava's 7th Birthday. October 24 at 3 PM.",
      birthdayAge: null,
    }),
    { title, ageOrdinal: "" },
  );
});

test("conflicting text ages remain unresolved", () => {
  assert.deepEqual(resolveOcrBirthdayTitle({ title, text: "Ava turns 7. Ava's 8th birthday." }), {
    title,
    ageOrdinal: "",
  });
});

test("structured visual ages support both childhood and adult birthdays", () => {
  for (const [birthdayAge, ageOrdinal] of [
    [7, "7th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
    [50, "50th"],
    ["7th", "7th"],
  ]) {
    assert.deepEqual(resolveOcrBirthdayTitle({ title, text: "October 24", birthdayAge }), {
      title: `Ava's ${ageOrdinal} Birthday Party — Pool Bash`,
      ageOrdinal,
    });
  }
});

test("invalid structured age values do not become birthday ages", () => {
  for (const birthdayAge of [0, -7, 7.5, 100, "October 7", "7 PM", "", "7+", "7–12"]) {
    assert.deepEqual(resolveOcrBirthdayTitle({ title, text: "7", birthdayAge }), {
      title,
      ageOrdinal: "",
    });
  }
});

test("non-birthday titles are unchanged", () => {
  assert.deepEqual(
    resolveOcrBirthdayTitle({ title: "Team 7 Pool Party", text: "7", birthdayAge: 7 }),
    {
      title: "Team 7 Pool Party",
      ageOrdinal: "",
    },
  );
});

test("both OCR prompt messages require birthday context and allow unknown ages", () => {
  const prompt = buildEventExtractionPrompt("2026-09-05");
  for (const message of [prompt.system, prompt.user]) {
    assert.match(message, /birthday context/i);
    assert.match(message, /birthdayAge=null/);
    assert.match(message, /omit age from the title and description/);
    assert.doesNotMatch(
      message,
      /that number is the AGE|visually detect large decorative age numbers/,
    );
  }
});

test("OCR pipeline uses the age resolver without standalone-number guessing", () => {
  const source = readFileSync(new URL("./pipeline.ts", import.meta.url), "utf8");
  assert.match(
    source,
    /resolveOcrBirthdayTitle\(\{\s*title: finalTitle,\s*text: raw,\s*birthdayAge: llmImage\?\.birthdayAge/,
  );
  assert.doesNotMatch(source, /candidateAges|candidateNumbers|standaloneNumber/);
});
