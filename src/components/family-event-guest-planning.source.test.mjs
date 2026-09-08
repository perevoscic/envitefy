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
    if (route === "gender-reveal") {
      assert.match(editor, /<GenderRevealTemplateView/);
      assert.match(editor, /\.\.\.data,/);
    } else {
      assert.match(editor, /<BabyShowerTemplateView/);
      assert.match(editor, /\.\.\.data,/);
    }
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
  test(`${route} omits the standalone guest action row from the editor and viewer`, () => {
    assert.doesNotMatch(editor, /EventGuestActions/);
    assert.doesNotMatch(viewer, /EventGuestActions/);
    assert.match(viewer, /<EventActions/);
    assert.match(viewer, /shareUrl=\{shareUrl\}/);
  });
}
