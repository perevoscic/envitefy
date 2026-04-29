import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("open house company logo is persisted as live-card UI metadata, not generation reference art", () => {
  const apiSource = readSource("src/app/studio/studio-workspace-api.ts");
  const builderSource = readSource("src/app/studio/studio-workspace-builders.ts");
  const sanitizeSource = readSource("src/app/studio/studio-workspace-sanitize.ts");
  const generateSource = readSource("src/lib/studio/generate.ts");

  assert.match(
    apiSource,
    /const realtorLogoUrls = sanitizeGuestImageUrls\(details\.realtorLogoUrls\)/,
  );
  assert.match(
    apiSource,
    /const preparedRealtorLogoUrls = await prepareUrls\(realtorLogoUrls, "studio-realtor-logo"\);/,
  );
  assert.match(apiSource, /realtorLogoUrls: preparedRealtorLogoUrls/);
  assert.match(sanitizeSource, /realtorLogoUrls: \[\]/);
  assert.match(
    sanitizeSource,
    /details\.realtorLogoUrls = sanitizeGuestImageUrls\(value\.realtorLogoUrls\)/,
  );
  assert.match(builderSource, /logo image\(s\) for the app Logo tab only/);
  assert.doesNotMatch(builderSource, /realtorLogoUrls:\s*sanitizedRealtorLogoUrls/);
  assert.doesNotMatch(generateSource, /\.\.\.\(event\.realtorLogoUrls \|\| \[\]\)/);
});
