import assert from "node:assert/strict";
import test from "node:test";

import {
  enrichTravelAccommodation,
  extractHotelCardsFromContent,
  extractHotelCandidatesFromMarkdown,
} from "./travel-accommodation-enrichment.ts";

test("extractHotelCardsFromContent parses HOST HOTEL INFORMATION cards with generic booking CTAs", () => {
  const content = `
## HOST HOTEL INFORMATION

### Hilton University of Florida Conference Center
1714 SW 34th St, Gainesville, FL 32607
Phone: (352) 371-3600
Reservation Deadline: March 20, 2026
Rates: $189 King | $199 Double Queen
Shuttle to venue included.
[Book Now](https://book.example.com/hilton-uf)

### Courtyard Gainesville
3700 SW 42nd Street, Gainesville, FL 32608
352-335-3800
Deadline to Book: March 18, 2026
Rate: $169/night plus tax
Newly renovated lobby.
[Reserve](https://book.example.com/courtyard)

## PARKING INFORMATION
Lot A opens at 6:30 AM.
`;

  const hotels = extractHotelCardsFromContent(content);

  assert.deepEqual(hotels, [
    {
      name: "Hilton University of Florida Conference Center",
      bookingUrl: "https://book.example.com/hilton-uf",
      address: "1714 SW 34th St, Gainesville, FL 32607",
      phone: "(352) 371-3600",
      reservationDeadline: "March 20, 2026",
      rateSummary: "$189 King $199 Double Queen",
      notes: "Shuttle to venue included.",
    },
    {
      name: "Courtyard Gainesville",
      bookingUrl: "https://book.example.com/courtyard",
      address: "3700 SW 42nd Street, Gainesville, FL 32608",
      phone: "352-335-3800",
      reservationDeadline: "March 18, 2026",
      rateSummary: "$169/night plus tax",
      notes: "Newly renovated lobby.",
    },
  ]);
});

test("extractHotelCandidatesFromMarkdown still derives names from nearby generic booking labels", () => {
  const markdown = `
Marriott Downtown
[Reserve here](https://book.example.com/marriott)

Host Hotels
[Book now](https://book.example.com/host-hotels)
`;

  const hotels = extractHotelCandidatesFromMarkdown(markdown);

  assert.deepEqual(hotels, [
    {
      name: "Marriott Downtown",
      url: "https://book.example.com/marriott",
    },
  ]);
});

test("extractHotelCardsFromContent ignores reserve hotel online CTA blocks and stops before local attractions", () => {
  const content = `
## HOST HOTEL INFORMATION

### DoubleTree by Hilton Gainesville
Phone: (352) 375-2400
Reservation Deadline: March 19, 2026
Rate: $148.00 + tax (per night)
Distance from Venue: 1.2 miles
Breakfast: Restaurant on-site
Parking: Complimentary
[Reserve Hotel Online](https://doubletree.example.com/book)

### Hotel Indigo
Phone: (352) 240-8900
Reservation Deadline: March 31, 2026
Rate: $199.00 + tax (per night)
Distance from Venue: Same complex
Breakfast: Restaurant on-site
Parking: Complimentary
[Reserve Hotel Online](https://indigo.example.com/book)

## LOCAL ATTRACTIONS
Depot Park
Open daily.
`;

  const hotels = extractHotelCardsFromContent(content);

  assert.deepEqual(hotels, [
    {
      name: "DoubleTree by Hilton Gainesville",
      bookingUrl: "https://doubletree.example.com/book",
      phone: "(352) 375-2400",
      reservationDeadline: "March 19, 2026",
      rateSummary: "$148.00 + tax (per night)",
      notes:
        "Distance from Venue: 1.2 miles | Breakfast: Restaurant on-site | Parking: Complimentary",
    },
    {
      name: "Hotel Indigo",
      bookingUrl: "https://indigo.example.com/book",
      phone: "(352) 240-8900",
      reservationDeadline: "March 31, 2026",
      rateSummary: "$199.00 + tax (per night)",
      notes:
        "Distance from Venue: Same complex | Breakfast: Restaurant on-site | Parking: Complimentary",
    },
  ]);
});

test("enrichTravelAccommodation prefers the same-host hotel hub when both hub and vendor links exist", async (t) => {
  const previousKey = process.env.FIRECRAWL_API_KEY;
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  const originalFetch = global.fetch;
  process.env.FIRECRAWL_API_KEY = "test-key";
  delete process.env.OPENAI_API_KEY;

  t.after(() => {
    global.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.FIRECRAWL_API_KEY;
    else process.env.FIRECRAWL_API_KEY = previousKey;
    if (previousOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousOpenAiKey;
  });

  const requestedUrls: string[] = [];
  global.fetch = (async (_input: any, init?: any) => {
    const body = JSON.parse(String(init?.body || "{}"));
    requestedUrls.push(String(body?.url || ""));
    return {
      ok: true,
      async json() {
        return {
          data: {
            markdown: `
## HOST HOTEL INFORMATION
### Hilton Garden Inn
4075 SW 33rd Place, Gainesville, FL 32608
[Book](https://book.example.com/hilton-garden)
`,
            metadata: {
              sourceURL: "https://usacompetitions.com/2026-xcel-bsg-state-championships/",
            },
          },
        };
      },
    } as Response;
  }) as typeof fetch;

  const travel = await enrichTravelAccommodation({
    traceId: "travel-test",
    extractionMeta: {
      resourceLinks: [
        {
          kind: "hotel_booking",
          label: "Host Hotels",
          url: "https://api.groupbook.io/group/usag-state-2026",
          sourceUrl: "https://usacompetitions.com/wp-content/uploads/2026/03/state-info.pdf",
        },
        {
          kind: "hotel_booking",
          label: "Host Hotel Information",
          url: "https://usacompetitions.com/2026-xcel-bsg-state-championships/",
          sourceUrl: "https://usacompetitions.com/wp-content/uploads/2026/03/state-info.pdf",
        },
      ],
    },
    budgetMs: 2_000,
  });

  assert.equal(requestedUrls[0], "https://usacompetitions.com/2026-xcel-bsg-state-championships/");
  assert.equal(
    travel?.hotelSource.sourceUrl,
    "https://usacompetitions.com/2026-xcel-bsg-state-championships/"
  );
  assert.equal(travel?.fallbackLink?.url, "https://api.groupbook.io/group/usag-state-2026");
  assert.deepEqual(travel?.hotels, [
    {
      name: "Hilton Garden Inn",
      bookingUrl: "https://book.example.com/hilton-garden",
      address: "4075 SW 33rd Place, Gainesville, FL 32608",
    },
  ]);
});

test("enrichTravelAccommodation uses AI fallback to recover hotel names from non-card layouts", async (t) => {
  const previousFirecrawlKey = process.env.FIRECRAWL_API_KEY;
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  const originalFetch = global.fetch;
  process.env.FIRECRAWL_API_KEY = "test-key";
  process.env.OPENAI_API_KEY = "openai-test-key";

  t.after(() => {
    global.fetch = originalFetch;
    if (previousFirecrawlKey === undefined) delete process.env.FIRECRAWL_API_KEY;
    else process.env.FIRECRAWL_API_KEY = previousFirecrawlKey;
    if (previousOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousOpenAiKey;
  });

  const requestedUrls: string[] = [];
  global.fetch = (async (input: any, init?: any) => {
    const url = String(input);
    requestedUrls.push(url);
    if (/firecrawl\.dev/.test(url)) {
      return {
        ok: true,
        async json() {
          return {
            data: {
              markdown: `
Travel accommodations
- DoubleTree by Hilton Gainesville [Reserve](https://book.example.com/doubletree) Phone: (352) 375-2400
- Hotel Indigo [Reserve](https://book.example.com/indigo) Phone: (352) 240-8900
`,
              metadata: {
                sourceURL: "https://example.com/event-hotels",
              },
            },
          };
        },
      } as Response;
    }
    const body = JSON.parse(String(init?.body || "{}"));
    assert.equal(body.model, process.env.OPENAI_TRAVEL_ACCOMMODATION_MODEL || process.env.OPENAI_DISCOVERY_PARSE_MODEL || "gpt-5.4-nano");
    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  sectionLabel: "Travel accommodations",
                  hotels: [
                    {
                      name: "DoubleTree by Hilton Gainesville",
                      bookingUrl: "https://book.example.com/doubletree",
                      phone: "(352) 375-2400",
                      reservationDeadline: null,
                      rateSummary: null,
                      address: null,
                      notes: null,
                    },
                    {
                      name: "Hotel Indigo",
                      bookingUrl: "https://book.example.com/indigo",
                      phone: "(352) 240-8900",
                      reservationDeadline: null,
                      rateSummary: null,
                      address: null,
                      notes: null,
                    },
                  ],
                  warnings: [],
                }),
              },
            },
          ],
        };
      },
    } as Response;
  }) as typeof fetch;

  const travel = await enrichTravelAccommodation({
    traceId: "travel-ai-fallback-test",
    extractionMeta: {
      resourceLinks: [
        {
          kind: "hotel_booking",
          label: "Host Hotel Information",
          url: "https://example.com/event-hotels",
          sourceUrl: "https://example.com/event-packet.pdf",
        },
      ],
    },
    budgetMs: 8_000,
  });

  assert.equal(requestedUrls.some((url) => /api\.openai\.com/.test(url)), true);
  assert.deepEqual(travel?.hotels, [
    {
      name: "DoubleTree by Hilton Gainesville",
      bookingUrl: "https://book.example.com/doubletree",
      phone: "(352) 375-2400",
    },
    {
      name: "Hotel Indigo",
      bookingUrl: "https://book.example.com/indigo",
      phone: "(352) 240-8900",
    },
  ]);
});

test("enrichTravelAccommodation records a clear timeout error when Firecrawl exceeds the budget", async (t) => {
  const previousKey = process.env.FIRECRAWL_API_KEY;
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  const originalFetch = global.fetch;
  process.env.FIRECRAWL_API_KEY = "test-key";
  delete process.env.OPENAI_API_KEY;

  t.after(() => {
    global.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.FIRECRAWL_API_KEY;
    else process.env.FIRECRAWL_API_KEY = previousKey;
    if (previousOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousOpenAiKey;
  });

  global.fetch = (async () => {
    const error = new Error("The operation was aborted");
    (error as any).name = "AbortError";
    throw error;
  }) as typeof fetch;

  const travel = await enrichTravelAccommodation({
    traceId: "travel-timeout-test",
    extractionMeta: {
      resourceLinks: [
        {
          kind: "hotel_booking",
          label: "Host Hotel Information",
          url: "https://usacompetitions.com/2026-xcel-bsg-state-championships/",
          sourceUrl: "https://usacompetitions.com/wp-content/uploads/2026/03/state-info.pdf",
        },
      ],
    },
    budgetMs: 25_000,
  });

  assert.equal(travel?.hotelSource.lastError, "Firecrawl scrape timed out after 25000ms");
});
