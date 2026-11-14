const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const { planGymMeetImportTemplate } = load("src/components/gym-meet-templates/registry.ts");

test("new imported compositions respond to schedule, lodging, club and admission density", () => {
  assert.equal(planGymMeetImportTemplate({}), "moonbeam-balance");
  assert.equal(planGymMeetImportTemplate({ advancedSections: { schedule: { days: [{ sessions: Array(8).fill({}) }] } } }), "neon-runway");
  assert.equal(planGymMeetImportTemplate({ advancedSections: { logistics: { hotelInfo: "Verified hotel information. ".repeat(20) } } }), "tidal-tumble");
  assert.equal(planGymMeetImportTemplate({ discoverySource: { websiteImport: { participatingClubs: Array(45).fill({}) } } }), "copper-grip");
  assert.equal(planGymMeetImportTemplate({ customFields: { admission: "Adults $20; Children $15; Weekend $30" } }), "crimson-collegiate");
});

test("smart card placement balances short prices and widens long guidance", () => {
  const { contentCardGridStyle, contentCardNeedsFullWidth } = load("src/components/event-create/EventPlaceCard.tsx");
  const prices = Array.from({ length: 6 }, () => ({ label: "Adults", body: "Cash only" }));
  assert.match(contentCardGridStyle(prices).gridTemplateColumns, /\/ 3/);
  assert.match(contentCardGridStyle(prices).gridTemplateColumns, /240px/);
  assert.match(contentCardGridStyle([{ label: "Hotel information", body: "Detailed verified information. ".repeat(30) }]).gridTemplateColumns, /420px/);
  assert.equal(contentCardNeedsFullWidth({ label: "Parking & arrival", body: "On-site parking costs $15.00." }), false);
  assert.equal(contentCardNeedsFullWidth({ label: "Traffic & travel", body: "Use the posted traffic directions. ".repeat(20) }), true);
});

test("Hotels retain lodging details while general travel guidance moves to Parking", () => {
  const { buildGymMeetDiscoveryContent } = load("src/components/gym-meet-templates/buildGymMeetDiscoveryContent.ts");
  const section = (body, extra = {}) => ({ visibility: "visible", body, title: "Imported information", provenance: "pdf_grounded", confidence: 1, ...extra });
  const content = buildGymMeetDiscoveryContent({ eventData: { createdVia: "meet-discovery", discoverySource: {
    pipelineVersion: "gym-public-v3", input: { type: "url" },
    publicPageSections: { meetDetails: section("Confirmed meet information."), travel: section("Host hotel rooms include breakfast. Use the free SkyTrain from the airport.", { items: [{ name: "Host Hotel", groupRate: "$190 per night", bookingUrl: "https://hotel.test/book" }] }) },
  } }, customFields: {}, advancedSections: {}, venue: "Convention Center", address: "2000 Convention Center Concourse" });
  const hotels = content.sections.find(section => section.id === "hotels");
  const travel = content.sections.find(section => section.id === "traffic-parking");
  assert.equal(hotels.label, "Hotels");
  assert.match(JSON.stringify(hotels), /Host Hotel/);
  assert.doesNotMatch(JSON.stringify(hotels), /SkyTrain/);
  assert.match(JSON.stringify(travel), /SkyTrain/);
});

test("hotel cards suppress placeholder callouts and redundant overview links while retaining useful booking facts", () => {
  const { buildGymMeetDiscoveryContent } = load("src/components/gym-meet-templates/buildGymMeetDiscoveryContent.ts");
  const overview = "https://meet.test/hotels";
  const build = (body, bullets, items) => buildGymMeetDiscoveryContent({ eventData: { createdVia: "meet-discovery", discoverySource: {
    pipelineVersion: "gym-public-v3", input: { type: "url" }, publicPageSections: { travel: {
      visibility: "visible", title: "Hotels", body, bullets, items, fallbackLink: overview, provenance: "pdf_grounded", confidence: 1,
    } },
  } }, customFields: {}, advancedSections: {}, venue: "Convention Center", address: "2000 Convention Center Concourse" });
  const items = [{ name: "Atlanta Airport Marriott Gateway", groupRate: "$194", bookingUrl: "https://hotel.test/book?group=meet" }];
  const hotels = build("Host hotels", ["Host hotels", "Plan your stay"], items).sections.find(section => section.id === "hotels");
  assert.deepEqual(hotels.blocks.map(block => block.id), ["hotel-cards"]);
  assert.equal(hotels.blocks[0].cards[0].action.url, items[0].bookingUrl);
  assert.match(JSON.stringify(hotels), /\$194/);
  const useful = build("Hotel parking free", ["Hotel booking deadline January 10, 2027", "Host hotels"], items).sections.find(section => section.id === "hotels");
  assert.match(JSON.stringify(useful), /Hotel parking free/);
  assert.match(JSON.stringify(useful), /January 10, 2027/);
  assert.doesNotMatch(JSON.stringify(useful), /Host hotels/);
  const empty = build("Host hotels", ["Plan your stay"], []).sections.find(section => section.id === "hotels");
  assert.equal(empty.blocks.some(block => block.id === "travel-guidance-cards"), false);
  assert.ok(empty.blocks.some(block => block.type === "link-list"), "a sole hotel source link remains available when no booking cards exist");
});
