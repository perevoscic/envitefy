import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

for (const [route, view] of [
  ["baby-showers", "BabyShowerTemplateView"],
  ["gender-reveal", "GenderRevealTemplateView"],
]) {
  const editor = readFileSync(new URL(`../app/event/${route}/customize/page.tsx`, import.meta.url), "utf8");
  const viewer = readFileSync(new URL(`./${view}.tsx`, import.meta.url), "utf8");
  test(`${route} saves, reloads, and displays optional guest planning`, () => {
    assert.match(editor, /guestPlanning: normalizeEventGuestPlanning\(existing\.guestPlanning\)/);
    assert.match(editor, /guestPlanning: data\.guestPlanning/);
    assert.match(editor, /<EventGuestPlanningEditor/);
    assert.match(editor, /<EventGuestPlanningNotes value=\{data\.guestPlanning\}/);
    assert.match(viewer, /<EventGuestPlanningNotes value=\{normalizeEventGuestPlanning\(eventData\.guestPlanning\)\}/);
  });
  test(`${route} uses explicit end time without manufacturing party duration`, () => {
    assert.match(editor, /label="End Time \(optional\)"/);
    assert.match(editor, /endTime: existing\.endTime \?\? restoredEndTime/);
    assert.match(editor, /let endISO: string \| null = null/);
    assert.match(editor, /end <= start/);
    for (const field of ["endAt", "end", "endISO"]) assert.ok(editor.includes(field === "endISO" ? "          endISO," : `          ${field}: endISO,`));
    assert.doesNotMatch(editor, /setHours\(end\.getHours\(\) \+ 3\)|60 \* 60 \* 1000/);
    assert.match(viewer, /endLabel/);
  });
  test(`${route} preview actions are accessible before the image and never share an editor URL`, () => {
    assert.ok(editor.indexOf("<EventGuestActions") < editor.indexOf('<div className="relative w-full aspect-video">'));
    assert.match(editor, /\n                preview\n/);
    assert.doesNotMatch(editor, /window\.location\.href|Share & Add to Calendar/);
    assert.match(viewer, /<EventGuestActions/);
    assert.match(viewer, /shareUrl=\{shareUrl\}/);
  });
}
