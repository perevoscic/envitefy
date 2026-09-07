import test from "node:test";
import assert from "node:assert/strict";
import { changedCardEditFields } from "./card-edit-fields.ts";

test("theme-only edits omit unchanged picker values and preserve event metadata", () => {
  const baseline = { title: "Livia is turning 10", eventDate: "2026-09-26", startTime: "15:00", endTime: "12:00", venueName: "AMC", location: "AMC" };
  assert.deepEqual(changedCardEditFields({ ...baseline, theme: "add katseye and needohs" }, baseline), { theme: "add katseye and needohs" });
});

test("explicit time changes and cleared fields are still submitted", () => {
  assert.deepEqual(changedCardEditFields({ startTime: "16:00", endTime: "" }, { startTime: "15:00", endTime: "12:00" }), { startTime: "16:00", endTime: "" });
});
