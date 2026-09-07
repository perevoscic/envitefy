import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

for (const route of ["general", "appointments", "workshops", "special-events"]) {
  const source = readFileSync(new URL(`../app/event/${route}/customize/page.tsx`, import.meta.url), "utf8");
  test(`${route} loads saved state before allowing an edit`, () => {
    assert.match(source, /useEffect/);
    assert.match(source, /fetch\(`\/api\/history\/\$\{editEventId\}`, \{ credentials: "include", cache: "no-store" \}\)/);
    assert.match(source, /submitting \|\| loadingExisting \|\| loadError/);
    assert.match(source, /if \(loadingExisting \|\| loadError\) return/);
    assert.match(source, /eventLocalDateParts\(existing\.startISO/);
    assert.match(source, /guestPlanning: normalizeEventGuestPlanning\(existing\.guestPlanning\)/);
    assert.match(source, /hero: existing\.heroImage \?\? existing\.hero/);
    assert.match(source, /\.\.\.savedEventData/);
    assert.match(source, /existing\.customFields/);
    if (route === "special-events") assert.match(source, /sponsors: Array\.isArray\(existing\.sponsors\)/);
    else assert.match(source, /setAdvancedState\(existing\.advancedSections/);
  });
  test(`${route} updates the same event and explicitly clears every end fallback`, () => {
    assert.match(source, /"PATCH"/);
    assert.match(source, /editEventId \? "history:updated" : "history:created"/);
    for (const field of ["endAt", "end"]) assert.ok(source.includes(`${field}: endISO,`));
    assert.match(source, /endTime: data\.endTime,/);
    assert.match(source, /endDate: data\.endDate,/);
    assert.doesNotMatch(source, /endTime: data\.endTime \|\| undefined/);
    assert.match(source, /numberOfGuests: savedEventData\.numberOfGuests \?\? 0/);
  });
}
