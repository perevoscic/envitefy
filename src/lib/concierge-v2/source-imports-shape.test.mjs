import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Concierge V2 source imports create source and extracted item runtime tables", async () => {
  const storage = await readFile(new URL("./storage.ts", import.meta.url), "utf8");
  const source = await readFile(new URL("./source-imports.ts", import.meta.url), "utf8");
  assert.match(storage, /create table if not exists source_documents/);
  assert.match(storage, /create table if not exists extracted_items/);
  assert.match(source, /createConciergeV2SourceImport/);
  assert.match(source, /parseConciergeInput/);
  assert.match(source, /insertExtractedItems/);
  assert.match(source, /generateOccurrences/);
  assert.match(source, /applyConciergeV2AcceptedImportItems/);
});

test("Concierge V2 import APIs expose list, create, review, and apply routes behind the import flag", async () => {
  const route = await readFile(
    new URL("../../app/api/concierge/events/[id]/imports/route.ts", import.meta.url),
    "utf8",
  );
  const itemRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/imports/[documentId]/items/[itemId]/route.ts", import.meta.url),
    "utf8",
  );
  const applyRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/imports/[documentId]/apply/route.ts", import.meta.url),
    "utf8",
  );
  const uploadRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/imports/upload/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /ENABLE_OCR_IMPORTS/);
  assert.match(route, /createConciergeV2SourceImport/);
  assert.match(uploadRoute, /createConciergeV2SourceImportFromFile/);
  assert.match(uploadRoute, /formData/);
  assert.match(itemRoute, /updateConciergeV2ExtractedItemStatus/);
  assert.match(applyRoute, /applyConciergeV2AcceptedImportItems/);
  assert.match(applyRoute, /resolveSessionUserId/);
});

test("Concierge V2 import UI supports pasted-text review and storage-backed uploads", async () => {
  const component = await readFile(
    new URL("../../app/concierge-v2/events/[id]/imports/ConciergeV2ImportCenterClient.tsx", import.meta.url),
    "utf8",
  );
  assert.match(component, /Source Import/);
  assert.match(component, /Extract details/);
  assert.match(component, /Accept all/);
  assert.match(component, /Apply accepted/);
  assert.match(component, /Upload source file/);
  assert.match(component, /type="file"/);
  assert.match(component, /provider_setup_required/i);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/imports/);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/imports\/upload/);
  assert.doesNotMatch(component, /Coming soon|\/api\/fake/);
});
