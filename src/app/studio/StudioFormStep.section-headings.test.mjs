import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio form step uses the editorial layout without the old optional panel chrome", () => {
  const source = readSource("src/app/studio/workspace/StudioFormStep.tsx");

  assert.doesNotMatch(source, />\s*Main fields\s*</);
  assert.doesNotMatch(source, />\s*Core fields\s*</);
  assert.doesNotMatch(source, />\s*When &amp; where\s*</);
  assert.doesNotMatch(source, /text-\[11px\][\s\S]*>\s*RSVP\s*<\/p>/);
  assert.doesNotMatch(source, /text-\[11px\][\s\S]*>\s*Optional\s*<\/p>/);
  assert.doesNotMatch(source, />\s*Optional extras\s*</);
  assert.doesNotMatch(source, />\s*Refinements and preferences\s*</);
  assert.doesNotMatch(source, />\s*Design Preferences\s*</);
  assert.doesNotMatch(source, />\s*Visual direction\s*</);
  assert.doesNotMatch(source, />\s*Behavior \/ Layout\s*</);

  assert.doesNotMatch(source, /Photos for your invite/);
  assert.doesNotMatch(source, /Personal Message/);
  assert.doesNotMatch(source, /Special Instructions/);
  assert.doesNotMatch(source, /Orientation/);
  assert.doesNotMatch(source, /Preferred Colors/);
  assert.doesNotMatch(source, /Visual Style Idea/);
  assert.doesNotMatch(source, /isOptionalCollapsed/);
  assert.doesNotMatch(source, /setIsOptionalCollapsed/);
  assert.doesNotMatch(source, /Shape the invitation details here/);
  assert.doesNotMatch(source, /const categoryFields = CATEGORY_FIELDS\[details\.category\] \|\| \[\];/);
  assert.doesNotMatch(source, /const primaryCategoryFields = categoryFields\.slice\(0, 2\);/);
  assert.doesNotMatch(source, /const rsvpPrimaryField: FieldConfig = \{/);
  assert.doesNotMatch(source, /const sharedSecondaryFields = SHARED_BASICS\.filter/);
  assert.doesNotMatch(source, /fields=\{RSVP_FIELDS\}/);
  assert.doesNotMatch(source, />\s*Additional details\s*</);
  assert.doesNotMatch(source, /End Time/);
  assert.doesNotMatch(source, /Venue Name/);
  assert.doesNotMatch(source, /Host Name/);
  assert.doesNotMatch(source, /Host Contact/);
  assert.doesNotMatch(source, /RSVP Deadline/);

  assert.match(source, /Event Details/);
  assert.match(source, /Design Idea/);
  assert.doesNotMatch(source, /Invitation Idea & Details/);
  assert.match(source, /StudioOptionalMediaRow/);
  assert.match(source, /space-y-10/);
  assert.match(source, /STUDIO_COMPACT_CATEGORY_FORM_CONFIG/);
  assert.match(source, /const formConfig = STUDIO_COMPACT_CATEGORY_FORM_CONFIG\[details\.category\];/);
  assert.match(source, /const primaryCategoryFields = formConfig\.primaryFields;/);
  assert.match(source, /const secondaryCategoryFields = formConfig\.secondaryFields \|\| \[\];/);
  assert.match(source, /const sharedPrimaryFields = SHARED_BASICS\.filter/);
  assert.doesNotMatch(source, /Responses typically within 48 hours/);
});

test("studio workspace no longer threads optional panel state into the form step", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.doesNotMatch(source, /const \[isOptionalCollapsed, setIsOptionalCollapsed\] = useState\(true\);/);
  assert.doesNotMatch(source, /setIsOptionalCollapsed\(false\);/);
  assert.doesNotMatch(source, /isOptionalCollapsed=\{isOptionalCollapsed\}/);
  assert.doesNotMatch(source, /setIsOptionalCollapsed=\{setIsOptionalCollapsed\}/);
});
