const assert = require("node:assert/strict");
const test = require("node:test");
const sharp = require("sharp");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const maps = loadTs("src/lib/event-arrival-map.ts");
const server = loadTs("src/lib/event-arrival-map-server.ts");
const custom = loadTs("src/lib/event-custom-design.ts");
const image = "data:image/webp;base64,YQ==";
const fixture = () => ({
  version: 1,
  sourceImage: image,
  mapImage: image,
  status: "ready",
  view: { latitude: 30.27481, longitude: -85.99046, zoom: 16, width: 960, height: 640 },
  markers: [
    {
      label: "Parking",
      kind: "parking",
      note: "Keep reserved spaces clear.",
      point: { x: 0.55, y: 0.44 },
      confirmed: false,
    },
    {
      label: "Student drop-off",
      kind: "dropoff",
      note: "Use the marked loop.",
      point: null,
      confirmed: false,
    },
  ],
});

test("arrival-map validation preserves source evidence and rejects unsafe or inconsistent maps", () => {
  assert.deepEqual(maps.normalizeArrivalMap(fixture()), fixture());
  for (const patch of [
    { sourceImage: "https://example.test/private.jpg" },
    { view: null },
    { markers: [{ ...fixture().markers[0], point: { x: NaN, y: 0.5 } }] },
    { markers: [{ ...fixture().markers[1], confirmed: true }] },
    { markers: Array(7).fill(fixture().markers[0]) },
  ])
    assert.equal(maps.normalizeArrivalMap({ ...fixture(), ...patch }), null);
  const details = {
    ...custom.emptyCustomEventDetails(),
    sections: [{ title: "Arrival", body: "Use the handout", map: fixture() }],
  };
  assert.deepEqual(custom.normalizeCustomEventDetails(details).sections[0].map, fixture());
  const hidden = custom.normalizeCustomEventDetails({ ...details, arrivalMapEnabled: false });
  assert.equal(hidden.arrivalMapEnabled, false);
  assert.deepEqual(hidden.sections[0].map, fixture());
  assert.equal(custom.normalizeCustomEventDetails({ ...details, arrivalMapEnabled: "false" }), null);
  assert.deepEqual(
    custom.applyCustomEventWording(details, custom.customEventWording(details)).sections[0].map,
    fixture(),
  );
});

test("only host-confirmed pixels become geographic directions, with a correct Mercator center", () => {
  const map = fixture();
  assert.equal(maps.arrivalMarkerDirections(map, map.markers[0]), null);
  const center = maps.arrivalMarkerCoordinates(map.view, { x: 0.5, y: 0.5 });
  assert.ok(Math.abs(center.longitude - map.view.longitude) < 1e-10);
  assert.ok(Math.abs(center.latitude - map.view.latitude) < 1e-10);
  const east = maps.arrivalMarkerCoordinates(map.view, { x: 0.75, y: 0.5 });
  assert.ok(Math.abs(east.longitude - center.longitude - (240 / (512 * 2 ** 16)) * 360) < 1e-10);
  assert.match(
    maps.arrivalMarkerDirections(map, { ...map.markers[0], confirmed: true }),
    /destination=30\./,
  );
});

test("local map framing magnifies nearby pins without changing saved geography", () => {
  const map = fixture();
  map.markers[1].point = { x: 0.56, y: 0.59 };
  const before = structuredClone(map);
  const frame = maps.arrivalMapFraming(map);
  assert.equal(frame.scale, 2);
  assert.equal(frame.centerX, 0.555);
  assert.equal(frame.centerY, 0.515);
  assert.deepEqual(map, before, "Framing never changes source pixels, marker positions or confirmation");
  for (const marker of map.markers) {
    const x = 0.5 + frame.scale * (marker.point.x - frame.centerX);
    const y = 0.5 + frame.scale * (marker.point.y - frame.centerY);
    assert.ok(x >= 0.1 && x <= 0.9 && y >= 0.1 && y <= 0.9);
  }
  const spread = { ...map, markers: [
    { ...map.markers[0], point: { x: 0.1, y: 0.1 } },
    { ...map.markers[1], point: { x: 0.9, y: 0.9 } },
  ] };
  assert.deepEqual(maps.arrivalMapFraming(spread), { scale: 1, centerX: 0.5, centerY: 0.5 });
  assert.deepEqual(maps.arrivalMapFraming({ ...map, markers: [] }), { scale: 1, centerX: 0.5, centerY: 0.5 });
  const edge = maps.arrivalMapFraming({ ...map, markers: [{ ...map.markers[0], point: { x: 0.95, y: 0.9 } }] });
  assert.deepEqual(edge, { scale: 2, centerX: 0.75, centerY: 0.75 });
});

test("document map matching uses real provider pixels, retains annotations, and never confirms AI pins", async (t) => {
  const priorToken = process.env.MAPBOX_API_KEY;
  process.env.MAPBOX_API_KEY = "fixture-token";
  const deps = { ...server.arrivalMapServerDeps };
  t.after(() => {
    Object.assign(server.arrivalMapServerDeps, deps);
    if (priorToken === undefined) delete process.env.MAPBOX_API_KEY;
    else process.env.MAPBOX_API_KEY = priorToken;
  });
  const source = await sharp({
    create: { width: 100, height: 100, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  const base = await sharp({
    create: { width: 960, height: 640, channels: 3, background: "green" },
  })
    .webp()
    .toBuffer();
  server.arrivalMapServerDeps.encode = (bytes) => sharp(bytes).webp().toBuffer();
  server.arrivalMapServerDeps.address = async () => ({
    location: { latitude: 30.27481, longitude: -85.99046 },
  });
  let request;
  server.arrivalMapServerDeps.fetch = async (url) => {
    assert.match(url, /api\.mapbox\.com\/styles\/v1\/mapbox\/streets-v12/);
    assert.doesNotMatch(url, /attribution=false|logo=false/);
    return new Response(base);
  };
  server.arrivalMapServerDeps.client = () => ({
    chat: {
      completions: {
        create: async (value) => {
          request = value;
          return {
            choices: [
              {
                finish_reason: "stop",
                message: {
                  content: JSON.stringify({
                    points: [
                      {
                        index: 0,
                        x: 0.55,
                        y: 0.44,
                        evidence: "The same long loop connects to the highway.",
                      },
                      { index: 1, x: null, y: null, evidence: "The drop-off mark is unclear." },
                      { index: 0, x: 0.9, y: 0.8, evidence: "Duplicate invalid response" },
                      { index: 9, x: 0.4, y: 0.4, evidence: "Unknown marker" },
                    ],
                  }),
                },
              },
            ],
          };
        },
      },
    },
  });
  const descriptor = {
    sectionIndex: 0,
    imageIndex: 0,
    crop: { left: 0.1, top: 0.2, right: 0.9, bottom: 1 },
    markers: fixture().markers.map(({ label, kind, note }) => ({ label, kind, note })),
  };
  const extracted = await server.extractArrivalMapSource(descriptor,
    [`data:image/png;base64,${source.toString("base64")}`]);
  assert.equal(request, undefined, "Source extraction requires no marker-alignment call");
  assert.equal(extracted.mapImage, undefined);
  assert.ok(extracted.markers.every((marker) => !marker.point && !marker.confirmed));
  const result = await server.prepareArrivalMap(
    descriptor,
    [`data:image/png;base64,${source.toString("base64")}`],
    "23937 Panama City Beach Parkway, Panama City Beach, FL",
    new AbortController().signal,
  );
  assert.equal(result.status, "ready");
  assert.equal(
    (await sharp(Buffer.from(result.sourceImage.split(",")[1], "base64")).metadata()).height,
    80,
  );
  assert.deepEqual(result.markers[0].point, { x: 0.55, y: 0.44 });
  assert.equal(result.markers[1].point, null);
  assert.ok(result.markers.every((marker) => !marker.confirmed));
  assert.ok(maps.normalizeArrivalMap(result));
  assert.equal(request.messages[1].content[1].image_url.url, result.sourceImage);
  const comparisonUrl = request.messages[1].content[2].image_url.url;
  assert.notEqual(comparisonUrl, result.mapImage, "Vision receives a diagnostic coordinate grid, never saved into the map");
  const comparisonMeta = await sharp(Buffer.from(comparisonUrl.split(",")[1], "base64")).metadata();
  assert.equal(comparisonMeta.width, result.view.width);
  assert.equal(comparisonMeta.height, result.view.height);

  // Refresh uses address/coordinates only, never resends source images to vision.
  let storedSourceVisionCalls = 0;
  server.arrivalMapServerDeps.client = () => {
    storedSourceVisionCalls++;
    throw new Error("Refresh must not use vision");
  };
  const refreshed = await server.refreshArrivalMapView(
    { ...result, markers: result.markers.map((m) => ({ ...m, confirmed: Boolean(m.point) })) },
    "23937 Panama City Beach Parkway",
    new AbortController().signal,
  );
  assert.equal(refreshed.status, "ready");
  assert.ok(refreshed.markers.every((m) => !m.point && !m.confirmed));
  const storedSnapshot = await server.prepareArrivalMapSnapshot(
    { ...result, sourceImage: "/api/blob/event-arrival-source.webp" },
    "23937 Panama City Beach Parkway",
    new AbortController().signal,
  );
  assert.equal(storedSnapshot.status, "ready");
  assert.equal(storedSourceVisionCalls, 0, "Stored original URLs are never fetched or sent to vision");
  server.arrivalMapServerDeps.fetch = async () => new Response("unavailable", { status: 503 });
  const failed = await server.refreshArrivalMapView(
    result,
    "23937 Panama City Beach Parkway",
    new AbortController().signal,
  );
  assert.equal(failed.status, "provider_unavailable");
  assert.equal(failed.sourceImage, result.sourceImage);
  server.arrivalMapServerDeps.address = async () => ({ location: null, candidates: [{}, {}] });
  assert.equal(
    (
      await server.refreshArrivalMapView(
        result,
        "23937 Panama City Beach Parkway",
        new AbortController().signal,
      )
    ).status,
    "location_unavailable",
  );
});

test("explicit saves persist both map images and confirmed markers; upload failure never writes the event", async (t) => {
  const savedWindow = global.window;
  global.window = { dispatchEvent() {} };
  t.after(() => {
    if (savedWindow === undefined) delete global.window;
    else global.window = savedWindow;
  });
  const uploads = [],
    writes = [];
  let fail = false;
  const { saveCustomEventPage } = loadTs("src/lib/event-custom-save.ts", {
    "@/utils/media-upload-client": {
      persistImageMediaValue: async ({ value, fileName }) => {
        uploads.push(fileName);
        return fail && fileName === "event-arrival-map.webp" ? null : `/api/blob/${fileName}`;
      },
    },
  });
  const map = fixture();
  map.markers[0].confirmed = true;
  const page = {
    version: 1,
    category: "general",
    artwork: image,
    design: {
      version: 1,
      name: "Park",
      description: "Park scenery",
      layout: "editorial",
      font: "modern",
      colors: { page: "#ffffff", surface: "#ffffff", ink: "#20332c", accent: "#345641" },
    },
    details: {
      ...custom.emptyCustomEventDetails(),
      timezone: "America/Chicago",
      sections: [{ title: "Parking", body: "Keep reserved spaces clear.", map }],
    },
  };
  const options = {
    page,
    eventId: "map-test",
    clientDraftId: "map-test",
    status: "draft",
    historyFetch: async (_url, init) => {
      writes.push(JSON.parse(init.body));
      return Response.json({ id: "map-test" });
    },
  };
  const result = await saveCustomEventPage(options);
  assert.deepEqual(uploads, [
    "event-page-artwork.webp",
    "event-arrival-source.webp",
    "event-arrival-map.webp",
  ]);
  assert.ok(custom.normalizeCustomEventPage(result.page));
  assert.equal(result.page.details.sections[0].map.markers[0].confirmed, true);
  assert.equal(
    page.details.sections[0].map.sourceImage,
    image,
    "Saving must preserve the in-memory source until success",
  );
  fail = true;
  await assert.rejects(saveCustomEventPage(options), /parking map could not be saved/);
  assert.equal(writes.length, 1);
});
