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

![Hilton exterior](https://images.example.com/hilton.jpg)
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
      imageUrl: "https://images.example.com/hilton.jpg",
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

test("enrichTravelAccommodation prefers the same-host hotel hub when both hub and vendor links exist", async (t) => {
  const previousKey = process.env.FIRECRAWL_API_KEY;
  const originalFetch = global.fetch;
  process.env.FIRECRAWL_API_KEY = "test-key";

  t.after(() => {
    global.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.FIRECRAWL_API_KEY;
    else process.env.FIRECRAWL_API_KEY = previousKey;
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

test("enrichTravelAccommodation records a clear timeout error when Firecrawl exceeds the budget", async (t) => {
  const previousKey = process.env.FIRECRAWL_API_KEY;
  const originalFetch = global.fetch;
  process.env.FIRECRAWL_API_KEY = "test-key";

  t.after(() => {
    global.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.FIRECRAWL_API_KEY;
    else process.env.FIRECRAWL_API_KEY = previousKey;
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
