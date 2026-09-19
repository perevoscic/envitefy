const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(this, request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request, parent, ...rest);
};
Module._extensions[".ts"] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, file);
const { withDirectRsvpInvitationData } = require("./live-card-rsvp.ts");
const { buildGuestRsvpSubmission } = require("../guest-rsvp.ts");
const { parseGenderRevealConfig } = require("../gender-reveal.ts");

const accepted = { title: "Taylor's reveal", heroTextMode: "image", eventDetails: { category: "Baby Shower", rsvpEnabled: true, rsvpDeadline: "2026-09-23", genderReveal: { guessesEnabled: false } } };
function renderData(data) {
  return withDirectRsvpInvitationData({ invitationData: accepted, row: { id: "reveal-event", data }, title: accepted.title }).eventDetails;
}
test("accepted generated reveal card uses the server's authoritative guest category and guess settings", () => {
  const details = renderData({ category: "Gender Reveal", rsvpEnabled: true, genderReveal: { guessesEnabled: true }, rsvp: { deadline: "2026-09-24" } });
  assert.equal(details.category, "Gender Reveal");
  assert.equal(details.rsvpDeadline, "2026-09-24");
  assert.equal(accepted.eventDetails.category, "Baby Shower", "visual generation metadata is not mutated");
  const input = { response: "yes", name: "Taylor QA", email: "qa@example.test", category: details.category, genderRevealConfig: parseGenderRevealConfig(details) };
  assert.throws(() => buildGuestRsvpSubmission(input), /Team Pink/);
  assert.deepEqual(buildGuestRsvpSubmission({ ...input, genderGuess: "blue" }).answersJson, { genderGuess: "blue" });
});
test("saved disabled/revealed settings override stale generated guess settings", () => {
  for (const genderReveal of [{ guessesEnabled: false }, { guessesEnabled: true, revealed: true }]) {
    const details = renderData({ category: "Gender Reveal", rsvpEnabled: true, genderReveal });
    assert.equal(buildGuestRsvpSubmission({ response: "yes", name: "Taylor QA", email: "qa@example.test", category: details.category, genderRevealConfig: parseGenderRevealConfig(details) }).answersJson, undefined);
  }
});
test("legacy reveal payload classification follows the same configuration marker as the RSVP API", () => {
  assert.equal(renderData({ category: "Baby Shower", rsvpEnabled: true, genderReveal: {} }).category, "Gender Reveal");
  assert.equal(renderData({ category: "Baby Shower", rsvpEnabled: true }).category, "Baby Shower");
});
