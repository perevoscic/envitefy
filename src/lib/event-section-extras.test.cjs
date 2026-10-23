const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const {
  normalizeEventSectionExtras,
  safeEventSectionPhotoUrl,
  safeEventSectionLink,
} = loadTs("src/lib/event-section-extras.ts");
const { normalizeEventPageComposition } = loadTs("src/lib/event-page-composition.ts");
const { emptyCustomEventDetails, normalizeCustomEventDetails } = loadTs("src/lib/event-custom-design.ts");

test("section photos accept uploaded media paths and web images while guest links require web addresses", () => {
  for (const url of ["/api/blob/event-media/arrival.webp", "/templates/event-pages/example.webp", "https://example.com/photo.webp", "http://example.com/photo.jpg"])
    assert.equal(safeEventSectionPhotoUrl(url), url);
  assert.equal(safeEventSectionLink(" HTTPS://EXAMPLE.COM "), "https://example.com/");
  assert.equal(safeEventSectionLink("/event/my-event"), undefined);
  for (const url of ["", "//outside.test/image.webp", "/\\outside.test/image.webp", "https:\\outside.test/image.webp", "https://example.com/a\nb", "\t/photo.webp", "javascript:alert(1)", "data:image/png;base64,YQ==", "blob:https://example.com/photo", "ftp://example.com/photo.webp", "https://", "https://example.com/" + "x".repeat(2000)]) {
    assert.equal(safeEventSectionPhotoUrl(url), undefined, JSON.stringify(url));
    assert.equal(safeEventSectionLink(url), undefined, JSON.stringify(url));
  }
});

test("empty photo and link kinds survive normalization so their editors can reopen", () => {
  assert.deepEqual(normalizeEventSectionExtras({ kind: "photos" }), { kind: "photos", photos: [] });
  assert.deepEqual(normalizeEventSectionExtras({ kind: "links" }), { kind: "links", links: [] });
  assert.deepEqual(normalizeEventSectionExtras({ kind: "unknown" }), {});
  for (const value of [null, undefined, false, [], "photos"])
    assert.deepEqual(normalizeEventSectionExtras(value), {});
});

test("unsafe rows are removed while unfinished link rows and valid photo captions are retained", () => {
  const raw = {
    photos: [
      { url: "/api/blob/event-media/a.webp", caption: "At the entrance" },
      { url: "javascript:alert(1)", caption: "Unsafe" },
      null,
    ],
    links: [
      { label: "Visitor information", url: "https://example.com/visit" },
      { label: "Finish this address later", url: "" },
      { label: "Whitespace is a blank draft", url: "   " },
      { label: "Unsafe", url: "data:text/html,example" },
      { label: "Missing URL" },
      false,
    ],
  };
  const before = structuredClone(raw);
  const normalized = normalizeEventSectionExtras(raw);
  assert.deepEqual(normalized, {
    photos: [{ url: "/api/blob/event-media/a.webp", caption: "At the entrance" }],
    links: [
      { label: "Visitor information", url: "https://example.com/visit" },
      { label: "Finish this address later", url: "" },
      { label: "Whitespace is a blank draft", url: "" },
    ],
  });
  assert.deepEqual(raw, before, "normalization does not change the mounted editor's input");
  assert.deepEqual(normalizeEventSectionExtras(JSON.parse(JSON.stringify(normalized))), normalized);
});

test("section extras bound photo and link counts and guest-visible text", () => {
  const normalized = normalizeEventSectionExtras({
    kind: "photos",
    photos: Array.from({ length: 25 }, (_, index) => ({ url: `/api/blob/photo-${index}.webp`, caption: "c".repeat(241) })),
    links: Array.from({ length: 25 }, (_, index) => ({ label: "l".repeat(241), url: `https://example.com/${index}` })),
  });
  assert.equal(normalized.photos.length, 20);
  assert.equal(normalized.links.length, 20);
  assert.ok(normalized.photos.every(({ caption }) => caption.length === 240));
  assert.ok(normalized.links.every(({ label }) => label.length === 240));
});

const sections = [
  { title: "Photo gallery", body: "Our event together.", kind: "photos", photos: [
    { url: "/api/blob/event-media/photo-1.webp", caption: "Welcome" },
    { url: "https://example.com/photo-2.webp", caption: "The gathering" },
  ] },
  { title: "Links", body: "More information.", kind: "links", links: [
    { label: "Venue", url: "https://example.com/venue" },
    { label: "Pending address", url: "" },
  ] },
  { title: "Empty gallery", body: "", kind: "photos", photos: [] },
  { title: "Empty links", body: "", kind: "links", links: [] },
];

test("native composition preserves typed sections, photo order and blank link drafts through a JSON roundtrip", () => {
  const composition = { version: 1, sections: sections.map((section, index) => ({ id: `info:section-${index}`, ...section })) };
  assert.deepEqual(normalizeEventPageComposition(composition), composition);
  assert.deepEqual(normalizeEventPageComposition(JSON.parse(JSON.stringify(composition))), composition);
  const unsafe = normalizeEventPageComposition({ version: 1, sections: [{
    id: "info:unsafe", title: "Links", body: "", kind: "links", links: [{ label: "Unsafe", url: "javascript:alert(1)" }],
  }] });
  assert.deepEqual(unsafe.sections[0], { id: "info:unsafe", title: "Links", body: "", kind: "links", links: [] });
});

test("custom event details preserve the same gallery and links through save-format normalization", () => {
  const details = { ...emptyCustomEventDetails(), sections: structuredClone(sections) };
  assert.deepEqual(normalizeCustomEventDetails(details), details);
  assert.deepEqual(normalizeCustomEventDetails(JSON.parse(JSON.stringify(details))), details);
  const unsafe = normalizeCustomEventDetails({ ...details, sections: [{
    title: "Photo gallery", body: "", kind: "photos", photos: [{ url: "//outside.test/photo.webp", caption: "Unsafe" }],
  }] });
  assert.deepEqual(unsafe.sections, [{ title: "Photo gallery", body: "", kind: "photos", photos: [] }]);
});

test("legacy native and custom text sections acquire no kind or empty media fields", () => {
  const legacy = { title: "Information", body: "Keep the original text." };
  const native = { version: 1, sections: [{ id: "info:original", ...legacy }] };
  assert.deepEqual(normalizeEventPageComposition(native), native);
  const custom = { ...emptyCustomEventDetails(), sections: [legacy] };
  assert.deepEqual(normalizeCustomEventDetails(custom), custom);
});
