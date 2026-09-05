import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import {
  buildTravelAccommodationState,
  enrichTravelAccommodation,
} from "./travel-accommodation-enrichment";
import {
  HOTEL_FIELDS,
  hotelDeadlineIso,
  hotelUrl,
  parseHotelEvidence,
  projectTravelHotels,
} from "./travel-accommodation-evidence";
import { readHotelPage } from "./travel-accommodation-providers/playwright";
import { extractPdfAnnotationLinks, extractPdfTextWithPdfJs } from "./pdf-raster";
import { mergePdfAndWebHotels } from "./travel-accommodation-discovery";
import { validateModelHotels } from "./travel-accommodation-providers/astra";
import { pdfLinkContext } from "./pdf-link-context";
import { buildGymMeetDiscoveryContent } from "../components/gym-meet-templates/buildGymMeetDiscoveryContent";

const eventUrl = "https://usacompetitions.com/south-florida-fright-invite/";
const bookingUrl =
  "https://www.marriott.com/event-reservations/reservation-link.mi?id=1764091239004&key=GRP&code=AbC#rooms";
// Facts transcribed from the organizer's Host Hotels section on 2026-09-05.
const fright = `### HOST HOTELS
#
Fort Lauderdale Marriott Coral Springs
Distance from Venue: 5 miles
Rate: $162.00 + tax (per night)
Breakfast: For Purchase
Parking: Complimentary Parking
Reservation Deadline: October 2, 2026
Phone Reservations: (954) 753-5598; mention “2026 Fright Invite”
[Reserve Hotel Online](${bookingUrl})
### LOCAL ATTRACTIONS
Everglades Holiday Park
Distance: 22 miles
### PHOTO GALLERY`;

test("organizer page produces one complete card with evidence and original booking parameters", async () => {
  const result = await enrichTravelAccommodation({
    sourceType: "url",
    sourceUrl: eventUrl,
    extractedText: fright,
    extractionMeta: null,
  });
  assert.equal(result.hotels.length, 1);
  const hotel = result.hotels[0];
  assert.equal(hotel.name, "Fort Lauderdale Marriott Coral Springs");
  assert.equal(hotel.bookingUrl, bookingUrl);
  assert.equal(hotel.groupRate, "$162.00 + tax (per night)");
  assert.equal(hotel.distanceFromVenue, "5 miles");
  assert.equal(hotel.phone, "(954) 753-5598");
  assert.equal(hotel.bookingInstructions, "mention “2026 Fright Invite”");
  assert.equal(hotel.reservationDeadline, "October 2, 2026");
  assert.deepEqual(hotel.notes, []);
  assert.equal(hotel.evidence?.groupRate?.[0].sourceUrl, eventUrl);
  assert.equal(hotel.evidence?.groupRate?.[0].quote, "Rate: $162.00 + tax (per night)");
  assert.equal(result.attempts.length, 0);
  assert.equal(buildTravelAccommodationState(result).status, "complete");
});

test("multiple cards keep addresses, rates and CTAs attached to the right hotel", () => {
  const hotels = parseHotelEvidence(`## HOST HOTEL INFORMATION
### Hilton Garden Inn
123 Main Street, Gainesville, FL 32608
Rate: $189 King | $199 Double Queen
[Book Now](https://book.example.com/hilton)
### Hotel Indigo
Rate: $199 plus tax
[Reserve](https://book.example.com/indigo)
## PARKING INFORMATION
Lot A opens at 6:30 AM.`);
  assert.equal(hotels.length, 2);
  assert.equal(hotels[0].address, "123 Main Street, Gainesville, FL 32608");
  assert.equal(hotels[0].groupRate, "$189 King | $199 Double Queen");
  assert.equal(hotels[1].bookingUrl, "https://book.example.com/indigo");
  assert.equal(hotels[1].notes.length, 0);
});

test("PDF hidden hyperlinks keep page context and resolve a generic booking label", async () => {
  const text = "HOST HOTELS\nHilton Garden Inn\nRate: $170 plus tax\nBook here";
  const result = await enrichTravelAccommodation({
    sourceType: "file",
    sourceId: "event-upload-1",
    extractedText: text,
    extractionMeta: {
      accommodationPageTexts: [{ pageNumber: 4, text }],
      annotationLinks: [{ url: bookingUrl, label: "Book here", pageNumber: 4, contextText: text }],
    },
  });
  assert.equal(result.hotels[0].bookingUrl, bookingUrl);
  assert.equal(result.hotels[0].evidence?.groupRate?.[0].pageNumber, 4);
  assert.equal(result.hotels[0].evidence?.groupRate?.[0].sourceId, "event-upload-1");
});

test("PDF coordinate context keeps the link label and the nearby hotel, excluding another column", () => {
  const result = pdfLinkContext(
    [60, 100, 120, 112],
    [
      { str: "Hilton Garden Inn", transform: [1, 0, 0, 1, 60, 150], width: 130 },
      { str: "Book here", transform: [1, 0, 0, 1, 60, 102], width: 60 },
      { str: "Unrelated hotel", transform: [1, 0, 0, 1, 350, 150], width: 100 },
    ],
  );
  assert.equal(result.label, "Book here");
  assert.equal(result.contextText, "Hilton Garden Inn\nBook here");
});

function mockScrape(t: TestContext, handler: typeof fetch) {
  const original = globalThis.fetch;
  const key = process.env.FIRECRAWL_API_KEY;
  const ai = process.env.OPENAI_API_KEY;
  const browser = process.env.DISCOVERY_TRAVEL_BROWSER_USE_ENABLED;
  process.env.FIRECRAWL_API_KEY = "fixture-key";
  delete process.env.OPENAI_API_KEY;
  delete process.env.DISCOVERY_TRAVEL_BROWSER_USE_ENABLED;
  globalThis.fetch = handler;
  t.after(() => {
    globalThis.fetch = original;
    for (const [name, value] of [
      ["FIRECRAWL_API_KEY", key],
      ["OPENAI_API_KEY", ai],
      ["DISCOVERY_TRAVEL_BROWSER_USE_ENABLED", browser],
    ]) {
      if (value === undefined) delete process.env[name!];
      else process.env[name!] = value;
    }
  });
}
const json = (content: string) =>
  new Response(JSON.stringify({ success: true, data: { markdown: content } }), { status: 200 });

test("PDF -> official hub -> hotel list follows links once and stores the source chain", async (t) => {
  const hub = "https://organizer.example/2026-event/";
  const list = "https://housing.example/2026/hotels";
  const requests: string[] = [];
  mockScrape(t, async (_input, init) => {
    const request = JSON.parse(String(init?.body));
    requests.push(request.url);
    return request.url === hub ? json(`[Host hotels](${list})`) : json(fright);
  });
  const result = await enrichTravelAccommodation({
    sourceType: "file",
    sourceUrl: "https://organizer.example/packet.pdf",
    extractedText: "Host Hotels: see link",
    extractionMeta: {
      annotationLinks: [{ label: "Host Hotel Information", url: hub, pageNumber: 2 }],
    },
    budgetMs: 1000,
  });
  assert.deepEqual(requests, [hub, list]);
  assert.equal(result.hotels.length, 1);
  assert.equal(result.sources?.find((source) => source.url === hub)?.pageNumber, 2);
  assert.equal(result.sources?.find((source) => source.url === list)?.parentUrl, hub);
  assert.equal(result.hotels[0].evidence?.name?.[0].sourceUrl, list);
  assert.equal(result.fallbackLink, list);
});

test("official event hotel hub ranks ahead of an external vendor link", async (t) => {
  const hub = "https://organizer.example/2026-event/";
  const requests: string[] = [];
  mockScrape(t, async (_input, init) => {
    requests.push(JSON.parse(String(init?.body)).url);
    return json(fright);
  });
  await enrichTravelAccommodation({
    sourceType: "file",
    extractedText: "",
    sourceUrl: "https://organizer.example/packet.pdf",
    extractionMeta: {
      resourceLinks: [
        { label: "Host Hotels", url: "https://vendor.example/group/2026" },
        { label: "Host Hotel Information", url: hub },
      ],
    },
    budgetMs: 1000,
  });
  assert.equal(requests[0], hub);
});

test("a shared deadline aborts network work, stops fallbacks and retains PDF facts", async (t) => {
  let signal: AbortSignal | null | undefined;
  let requests = 0;
  mockScrape(t, async (_input, init) => {
    requests++;
    signal = init?.signal;
    return new Promise<Response>(() => {});
  });
  const result = await enrichTravelAccommodation({
    sourceType: "file",
    extractedText: "Host Hotels\nHilton Garden Inn\nRate: $170",
    extractionMeta: {
      resourceLinks: [{ label: "Hotel Information", url: "https://organizer.example/hotels" }],
    },
    budgetMs: 25,
  });
  assert.equal(requests, 1);
  assert.equal(signal?.aborted, true);
  assert.match(result.attempts[0].error || "", /timed out after 25ms/);
  assert.equal(result.hotels[0].groupRate, "$170");
  assert.equal(buildTravelAccommodationState(result).status, "partial");
});

test("caller cancellation propagates instead of saving a cancelled result", async (t) => {
  const controller = new AbortController();
  mockScrape(t, async () => {
    controller.abort(new Error("Event cancelled"));
    return new Promise<Response>(() => {});
  });
  await assert.rejects(
    enrichTravelAccommodation({
      sourceType: "file",
      extractedText: "",
      extractionMeta: {
        resourceLinks: [{ label: "Hotels", url: "https://organizer.example/hotels" }],
      },
      signal: controller.signal,
    }),
    /Event cancelled/,
  );
});

test("conflicting rates stay unresolved with both sources; equivalent phone formatting does not conflict", () => {
  const pdf = parseHotelEvidence(
    "Host Hotels\nHilton Garden Inn\nRate: $170\nPhone: 954-753-5598",
    { sourceType: "pdf", sourceUrl: "https://organizer.example/packet.pdf" },
  );
  const web = parseHotelEvidence(
    "Host Hotels\nHilton Garden Inn\nRate: $190\nPhone: (954) 753-5598",
    { sourceUrl: eventUrl },
  );
  const merged = mergePdfAndWebHotels(pdf, web)[0];
  assert.equal(merged.groupRate, null);
  assert.deepEqual(
    merged.conflicts?.groupRate?.map((fact) => fact.value),
    ["$170", "$190"],
  );
  assert.equal(merged.conflicts?.phone, undefined);
});

test("different hotels sharing the same housing link remain separate", () => {
  const hotels = parseHotelEvidence(
    `Host Hotels\nHilton Garden Inn\n[Book](${bookingUrl})\nHotel Indigo\n[Book](${bookingUrl})`,
  );
  assert.equal(mergePdfAndWebHotels([], hotels).length, 2);
});

test("refresh preserves manual edits and explicit clears while updating untouched fields", () => {
  const initial = projectTravelHotels([
    { name: "Hotel Indigo", groupRate: "$170", phone: "111", parking: "Paid" },
  ]);
  initial.hotels[0].groupRate = "$150";
  initial.hotels[0].phone = null;
  const next = projectTravelHotels(
    [{ name: "Hotel Indigo", groupRate: "$190", phone: "222", parking: "Free" }],
    initial.hotels,
    initial.discoveredHotelIds,
  );
  assert.equal(next.hotels[0].groupRate, "$150");
  assert.equal(next.hotels[0].phone, null);
  assert.equal(next.hotels[0].parking, "Free");
  const again = projectTravelHotels(
    [{ name: "Hotel Indigo", groupRate: "$200" }],
    next.hotels,
    next.discoveredHotelIds,
  );
  assert.equal(again.hotels[0].groupRate, "$150");
});

test("deleted hotels do not return on refresh", () => {
  const initial = projectTravelHotels([{ name: "Hotel Indigo" }]);
  assert.deepEqual(
    projectTravelHotels([{ name: "Hotel Indigo" }], [], initial.discoveredHotelIds).hotels,
    [],
  );
});

test("failed refresh keeps previous hotel records and original check evidence", () => {
  const hotels = parseHotelEvidence(fright, { sourceUrl: eventUrl });
  const state = buildTravelAccommodationState(
    {
      hotels: [],
      pdfHotels: [],
      candidates: [],
      attempts: [{ provider: "playwright", ok: false, url: eventUrl, error: "Timeout" }],
      fallbackLink: null,
      confidence: 0.4,
      resolution: { provider: "none", resolvedUrl: null, resolutionType: "none", confidence: 0.4 },
    },
    { hotels },
  );
  assert.equal(state.status, "partial");
  assert.equal(state.hotels[0].bookingUrl, bookingUrl);
});

test("model fields require evidence in that hotel's own source block", () => {
  const block = "Small Boutique Stay\nRate: $170";
  const fields: Record<string, { value: string; quote: string } | null> = Object.fromEntries(
    HOTEL_FIELDS.map((field) => [field, null]),
  );
  fields.name = { value: "Small Boutique Stay", quote: "Small Boutique Stay" };
  fields.groupRate = { value: "$170", quote: "Rate: $170" };
  fields.parking = { value: "Free", quote: "Parking: Free" };
  const hotels = validateModelHotels(
    { hotels: [{ sourceBlock: block, fields }] },
    `${block}\nAnother Hotel\nParking: Free`,
    { sourceUrl: eventUrl },
  );
  assert.equal(hotels.length, 1);
  assert.equal(hotels[0].groupRate, "$170");
  assert.equal(hotels[0].parking, null);
  assert.deepEqual(
    validateModelHotels({ hotels: [{ sourceBlock: "Invented source", fields }] }, block, {}),
    [],
  );
});

test("URLs preserve group parameters and fragments and reject non-web schemes", () => {
  assert.equal(hotelUrl(bookingUrl), bookingUrl);
  assert.equal(hotelUrl("javascript:alert(1)"), null);
  assert.equal(hotelUrl("/hotels#group", eventUrl), "https://usacompetitions.com/hotels#group");
});

test("links explicitly naming a different year are not fetched", async () => {
  const result = await enrichTravelAccommodation({
    sourceType: "file",
    extractedText: "",
    extractionMeta: {
      resourceLinks: [{ label: "Hotels", url: "https://organizer.example/2025/hotels" }],
    },
    eventYear: "2026",
  });
  assert.match(result.attempts[0].error || "", /different event year/);
  assert.equal(result.fallbackLink, null);
});

test("deadlines require an explicit year and a real calendar date", () => {
  assert.equal(hotelDeadlineIso("October 2, 2026"), "2026-10-02");
  assert.equal(hotelDeadlineIso("October 2"), null);
  assert.equal(hotelDeadlineIso("February 30, 2026"), null);
  assert.equal(hotelDeadlineIso("02/03/2026"), null);
});

test("browser DOM extraction preserves real hrefs and heading boundaries", async () => {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<nav>Other Event Hotel</nav><main><h3>HOST HOTELS</h3><p>Fort Lauderdale Marriott Coral Springs</p><p>Rate: $162.00 + tax (per night)</p><a href="${bookingUrl}">Reserve Hotel Online</a><h3>LOCAL ATTRACTIONS</h3><p>Everglades Holiday Park</p></main>`,
    );
    const content = await readHotelPage(page);
    const hotels = parseHotelEvidence(content, { sourceUrl: eventUrl });
    assert.equal(hotels.length, 1);
    assert.equal(hotels[0].bookingUrl, bookingUrl);
    assert.equal(hotels[0].notes.length, 0);
    assert.equal(content.includes("Other Event Hotel"), false);
    const pdf = await page.pdf();
    const annotations = await extractPdfAnnotationLinks(pdf);
    const extracted = await extractPdfTextWithPdfJs(pdf);
    assert.equal(annotations[0].url, bookingUrl);
    assert.match(annotations[0].contextText || "", /Marriott Coral Springs/);
    const imported = await enrichTravelAccommodation({
      sourceType: "file",
      extractedText: extracted.text,
      sourceId: "browser-pdf-fixture",
      extractionMeta: {
        annotationLinks: annotations,
        accommodationPageTexts: extracted.pages.map((item) => ({
          pageNumber: item.num,
          text: item.text,
        })),
      },
    });
    assert.equal(imported.hotels[0].bookingUrl, bookingUrl);
    assert.equal(imported.hotels[0].evidence?.bookingUrl?.[0].pageNumber, 1);
  } finally {
    await browser.close();
  }
});

test("Astra request uses the evidence schema and validates the returned hotel", async (t) => {
  const block = "Small Boutique Stay\nRate: $170";
  const fields = Object.fromEntries(
    HOTEL_FIELDS.map((field) => [
      field,
      field === "name"
        ? { value: "Small Boutique Stay", quote: "Small Boutique Stay" }
        : field === "groupRate"
          ? { value: "$170", quote: "Rate: $170" }
          : null,
    ]),
  );
  mockScrape(t, async (input, init) => {
    assert.match(String(input), /api.openai.com/);
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, process.env.OPENAI_TRAVEL_ACCOMMODATION_MODEL || "gpt-6-astra");
    assert.equal(body.response_format.json_schema.strict, true);
    return new Response(
      JSON.stringify({
        choices: [
          {
            finish_reason: "stop",
            message: { content: JSON.stringify({ hotels: [{ sourceBlock: block, fields }] }) },
          },
        ],
      }),
    );
  });
  process.env.OPENAI_API_KEY = "fixture-key";
  const result = await enrichTravelAccommodation({
    sourceType: "file",
    extractedText: `Host Hotels\n${block}`,
    extractionMeta: { accommodationPageTexts: [{ pageNumber: 3, text: `Host Hotels\n${block}` }] },
  });
  assert.equal(result.hotels[0].name, "Small Boutique Stay");
  assert.equal(result.hotels[0].evidence?.groupRate?.[0].pageNumber, 3);
});

test("public hotel cards show address and booking instructions with the original CTA", () => {
  const hotel = parseHotelEvidence(fright, { sourceUrl: eventUrl })[0];
  hotel.address = "123 Main Street, Coral Springs, FL";
  const content = buildGymMeetDiscoveryContent({
    eventData: { title: "Fright Invite" },
    customFields: {},
    advancedSections: { logistics: { hotels: [hotel] } },
    date: "2026-10-23",
  });
  const serialized = JSON.stringify(content.sections.find((section) => section.id === "hotels"));
  assert.ok(serialized);
  assert.ok(serialized.includes(hotel.address));
  assert.ok(serialized.includes("mention “2026 Fright Invite”"));
  assert.ok(serialized.includes(bookingUrl));
});
