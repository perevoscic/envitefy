import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("studio optional media row keeps photo guidance while removing the flyer upload action", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/app/studio/workspace/StudioOptionalMediaRow.tsx"),
    "utf8",
  );

  assert.match(source, /Optional image source/);
  assert.match(source, /Add photo\(s\) to design the invitation around the people or subject/);
  assert.match(
    source,
    /If this live card started from an uploaded invite,[\s\S]*that original art[\s\S]*stays attached/,
  );
  assert.match(source, /grid grid-cols-1 gap-3 lg:col-span-6 lg:grid-cols-1/);
  assert.match(source, />\s*Photos\s*</);
  assert.match(source, /House Photos/);
  assert.match(source, /Realtor Photo/);
  assert.match(source, />\s*Logo\s*</);
  assert.match(source, /Company Logo/);
  assert.match(source, /Realtor and Logo tabs, not flyer artwork/);
  assert.match(source, /STUDIO_OPEN_HOUSE_PROPERTY_IMAGE_URL_MAX/);
  assert.match(source, /STUDIO_OPEN_HOUSE_REALTOR_IMAGE_URL_MAX/);
  assert.match(source, /STUDIO_OPEN_HOUSE_REALTOR_LOGO_URL_MAX/);
  assert.doesNotMatch(source, /onUploadFlyer/);
  assert.doesNotMatch(source, /flyerActive \? "Replace" : "Flyer"/);
  assert.doesNotMatch(source, />\s*Flyer\s*</);
  assert.doesNotMatch(source, /Upload photo\(s\)/);
});
