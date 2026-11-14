const test = require("node:test");
const assert = require("node:assert/strict");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");

test("verified venue website photos retain attribution and stop matching after a venue/address edit", () => {
  const { venueWebsitePhoto, readVenuePhotoReference } = load("src/lib/venue-photo-source.ts");
  const context = { venue: "Georgia International Convention Center", address: "2000 Convention Center Concourse" };
  const reference = { venue: context.venue, sourceUrl: "https://www.gicc.com/planners/media-kit/", imageUrl: "https://www.gicc.com/wp-content/uploads/2017/10/GICC_Night.jpg" };
  const { verifyVenuePhotoPermission } = load("src/lib/venue-photo-permission.ts");
  assert.deepEqual(venueWebsitePhoto(context.venue, context.address, context, reference), { sourceUrl: reference.sourceUrl, reference }, "a verified building without reuse evidence triggers permission research");
  reference.permission = verifyVenuePhotoPermission("<p>Image use terms: Photos may be used in promotional event materials.</p>", reference.sourceUrl, reference.imageUrl);
  assert.deepEqual(venueWebsitePhoto(context.venue, context.address, context, reference), { url: reference.imageUrl, sourceUrl: reference.sourceUrl, permission: reference.permission });
  assert.equal(venueWebsitePhoto("Another venue", context.address, context, reference), undefined);
  assert.equal(venueWebsitePhoto(context.venue, "99 Other Road", context, reference), undefined);
  assert.equal(venueWebsitePhoto(context.venue, context.address, undefined, reference), undefined);
  assert.equal(readVenuePhotoReference({ ...reference, imageUrl: "javascript:alert(1)" }), undefined);
  assert.equal(readVenuePhotoReference({ ...reference, sourceUrl: "https://user:secret@gicc.com/" }), undefined);
});

test("photo permission requires an explicit event-use grant and retains exact terms and asset evidence", () => {
  const { verifyVenuePhotoPermission, readVenuePhotoPermission } = load("src/lib/venue-photo-permission.ts");
  const source = "https://venue.test/media", image = "https://venue.test/exterior.jpg";
  const grant = "Images may be used in promotional event materials.";
  const proof = verifyVenuePhotoPermission(`<p>Image use terms: ${grant}</p>`, source, image);
  assert.equal(proof.statement, grant);
  assert.equal(proof.termsUrl, source);
  assert.equal(proof.imageUrl, image);
  assert.ok(Number.isFinite(Date.parse(proof.checkedAt)));
  assert.deepEqual(readVenuePhotoPermission(proof, source, image), proof);
  assert.equal(readVenuePhotoPermission(proof, source, "https://venue.test/another.jpg"), undefined);
  assert.equal(readVenuePhotoPermission(proof, "https://other.test/media", image), undefined);
  for (const html of [
    "<p>Photo source: Venue. All rights reserved.</p>",
    `<script>Image use terms: ${grant}</script>`,
    `<p>Image use terms: ${grant} Permission is required before use.</p>`,
    `<p>Image use terms: ${grant}</p><p>Photographer credit is required.</p>`,
    "<p>Image use terms: Images may be used in promotional event materials for non-commercial use only.</p>",
    "<p>Image use terms: Images may not be used in promotional event materials.</p>",
  ]) assert.equal(verifyVenuePhotoPermission(html, source, image), undefined, html);
});

test("permission research finds a licensed alternative on a linked media page and caches the public evidence", async () => {
  const venue = "Example Convention Center", sourceUrl = "https://venue.test/about", imageUrl = "https://venue.test/old-exterior.jpg";
  const gallery = "https://venue.test/media-kit", permitted = "https://venue.test/new-exterior.jpg";
  const reads = [];
  const mod = load("src/lib/venue-photo-permission-server.ts", { "./create/read-source": { readPublicCreateUrl: async (url, signal) => {
    assert.ok(signal instanceof AbortSignal); reads.push(url);
    return { url, mimeType: "text/html", bytes: Buffer.from(url === sourceUrl
      ? `<h1>${venue}</h1><a href="/media-kit">Media gallery</a><img src="${imageUrl}">`
      : `<h1>${venue}</h1><p>Image use terms: Photos may be used in promotional event materials.</p><img src="${permitted}">`) };
  } } });
  const reference = { venue, sourceUrl, imageUrl };
  const [first, second] = await Promise.all([mod.findPermittedVenuePhoto(venue, reference), mod.findPermittedVenuePhoto(venue, reference)]);
  assert.equal(first.imageUrl, permitted);
  assert.equal(first.sourceUrl, gallery);
  assert.equal(first.permission.imageUrl, permitted);
  assert.deepEqual(second, first);
  assert.deepEqual(reads, [sourceUrl, gallery], "concurrent page visitors share one bounded permission search");
  await mod.findPermittedVenuePhoto(venue, reference);
  assert.equal(reads.length, 2);
});

test("permission research reuses the import page and keeps looking after denied media, without following other websites", async () => {
  const venue = "Example Convention Center", sourceUrl = "https://venue.test/about", imageUrl = "https://venue.test/exterior.jpg";
  const reads = [];
  const mod = load("src/lib/venue-photo-permission-server.ts", { "./create/read-source": { readPublicCreateUrl: async url => {
    reads.push(url);
    return { url, mimeType: "text/html", bytes: Buffer.from(`<h1>${venue}</h1><p>Image use terms: Photos may be used in promotional event materials.${url.endsWith("denied") ? " Approval is required." : ""}</p><img src="${imageUrl}">`) };
  } } });
  const result = await mod.findPermittedVenuePhoto(venue, { venue, sourceUrl, imageUrl }, { html: `<h1>${venue}</h1>
    <a href="https://elsewhere.test/media-kit">Other gallery</a><a href="/media-denied">Media</a><a href="/photo-gallery">Photos</a>` });
  assert.equal(result.sourceUrl, "https://venue.test/photo-gallery");
  assert.deepEqual(reads, ["https://venue.test/media-denied", "https://venue.test/photo-gallery"]);
});

test("unavailable or unpermitted media returns no photo and the public route validates its inputs", async () => {
  const venue = "Example Convention Center", sourceUrl = "https://venue.test/about", imageUrl = "https://venue.test/exterior.jpg";
  let reads = 0;
  const mod = load("src/lib/venue-photo-permission-server.ts", { "./create/read-source": { readPublicCreateUrl: async url => {
    reads++;
    return { url, mimeType: "text/html", bytes: Buffer.from(`<h1>${venue}</h1><p>All rights reserved.</p><img src="${imageUrl}">`) };
  } } });
  const route = load("src/app/api/maps/venue-photo-permission/route.ts", { "@/lib/venue-photo-permission-server": mod });
  const request = body => new Request("https://app.test/api/maps/venue-photo-permission", { method: "POST", body: JSON.stringify(body) });
  assert.equal((await route.POST(request({ venue, reference: { venue, sourceUrl: "javascript:alert(1)", imageUrl } }))).status, 400);
  assert.equal(reads, 0);
  const response = await route.POST(request({ venue, reference: { venue, sourceUrl, imageUrl } }));
  assert.deepEqual(await response.json(), { photo: null });
  assert.equal(reads, 1);
});

test("Google venue photos require the exact venue and address, hide keys, and retain attribution", async () => {
  const { findVenuePhoto } = load("src/lib/venue-photo.ts");
  const before = global.fetch, key = process.env.GOOGLE_PLACES_API_KEY;
  process.env.GOOGLE_PLACES_API_KEY = "private-key";
  const calls = [];
  let address = "2000 Convention Center Concourse, College Park, GA 30337";
  global.fetch = async (url, options) => {
    calls.push([url, options]);
    return url.includes("searchText") ? Response.json({ places: [{ displayName: { text: "Georgia International Convention Center" }, formattedAddress: address,
      googleMapsUri: "https://maps.google.com/venue", photos: [{ name: "places/gicc/photos/exterior", googleMapsUri: "https://maps.google.com/photo",
        authorAttributions: [{ displayName: "Venue photographer", uri: "https://maps.google.com/author" }] }] }] })
      : Response.json({ photoUri: "https://lh3.googleusercontent.com/exterior" });
  };
  try {
    const photo = await findVenuePhoto("Georgia International Convention Center", "2000 Convention Center Concourse");
    assert.equal(photo.url, "https://lh3.googleusercontent.com/exterior");
    assert.equal(photo.mapsUrl, "https://maps.google.com/photo");
    assert.equal(photo.authors[0].name, "Venue photographer");
    assert.ok(!JSON.stringify(photo).includes("private-key"));
    assert.ok(calls.every(([, options]) => options.cache === "no-store"));
    calls.length = 0;
    address = "99 Different Road, Atlanta, GA";
    assert.equal(await findVenuePhoto("Georgia International Convention Center", "2000 Convention Center Concourse"), null);
    assert.equal(calls.length, 1, "a mismatched branch never retrieves a photo");
  } finally {
    global.fetch = before;
    if (key === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
    else process.env.GOOGLE_PLACES_API_KEY = key;
  }
});
