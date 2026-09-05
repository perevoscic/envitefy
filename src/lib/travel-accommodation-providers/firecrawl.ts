import { hotelUrl, markdownHotelLinks, parseHotelEvidence } from "../travel-accommodation-evidence";
import { extractHotelEvidenceWithAstra } from "./astra";
import type { TravelProviderOptions, TravelProviderResult } from "./budget";

export async function extractHotelsWithFirecrawlScrape(
  url: string,
  options: TravelProviderOptions,
): Promise<TravelProviderResult> {
  const response = await fetch(
    `${(process.env.FIRECRAWL_BASE_URL || "https://api.firecrawl.dev").replace(/\/+$/, "")}/v2/scrape`,
    {
      method: "POST",
      signal: options.signal,
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: Math.min(120000, options.timeoutMs),
      }),
    },
  );
  if (!response.ok) throw new Error(`Hotel page scrape returned HTTP ${response.status}`);
  const payload: {
    success?: boolean;
    data?: { markdown?: string; metadata?: { sourceURL?: string } };
  } = await response.json();
  if (payload.success === false || typeof payload.data?.markdown !== "string")
    throw new Error("Hotel page scrape returned no source content");
  const content = payload.data.markdown;
  const sourceUrl = hotelUrl(payload.data.metadata?.sourceURL) || url;
  const links = markdownHotelLinks(content, sourceUrl);
  const context = { sourceUrl, sourceType: "web" as const, links };
  let hotels = parseHotelEvidence(content, context);
  if (!hotels.length) hotels = await extractHotelEvidenceWithAstra(content, context, options);
  return {
    hotels,
    links,
    content,
    fallbackLink: null,
    attempt: { provider: "firecrawl_scrape_json", ok: true, url: sourceUrl, error: null },
  };
}
