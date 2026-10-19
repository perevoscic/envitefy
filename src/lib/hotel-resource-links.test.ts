import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import { isHotelResourceLink, selectHotelResourceFallback } from "./hotel-resource-links";
import { detectTravelAccommodationCandidates, selectFallbackTravelLink } from "./travel-accommodation-discovery";
import { buildGymMeetDiscoveryContent } from "../components/gym-meet-templates/buildGymMeetDiscoveryContent";

const vendor = "https://a-1awards.com/";
const booking = "https://www.marriott.com/event-reservations/reservation-link.mi?id=123&key=GRP#rooms";
const hub = "https://organizer.example/2026-meet/";
const pageText = "Host Hotels\nClick here for all host hotels\nThank you to our awards sponsor";

// Exercise the actual core callbacks without initializing extraction providers.
const core = fs.readFileSync(new URL("./meet-discovery/core.ts", import.meta.url), "utf8");
const parsed = ts.createSourceFile("core.ts", core, ts.ScriptTarget.Latest, true);
const dependencies: Record<string, any> = { exports: {}, isHotelResourceLink, cleanExtractedText: (value: string) => value };
function loadCore(name: string) {
  const declaration = parsed.statements.find((node: any) => node.name?.text === name)!;
  assert.ok(declaration, `Missing core callback: ${name}`);
  const code = ts.transpileModule(`${declaration.getText(parsed)}\nreturn ${name};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  dependencies[name] = new Function(...Object.keys(dependencies), code)(...Object.values(dependencies));
}
for (const name of [
  "safeString", "normalizeUrl", "uniqueBy", "titleCaseWords", "fallbackLinkLabel",
  "classifyResourceLink", "fallbackLabelFromPdfAnnotation", "looksLikeGenericResourceLabel",
  "splitPdfPageLinesForLabeling", "normalizeUrlForLooseSearch", "inferKindBasedPdfLabel", "derivePdfAnnotationLabel",
  "normalizeResourceLinkLabel",
]) loadCore(name);

test("PDF page hotel headings cannot relabel an unrelated annotation as Host Hotels", () => {
  const label = dependencies.derivePdfAnnotationLabel({ url: vendor, pageNumber: 1 }, [{ num: 1, text: pageText }]);
  assert.doesNotMatch(label, /hotel|travel/i);
  assert.equal(dependencies.classifyResourceLink(label, vendor), "other");
  assert.equal(dependencies.classifyResourceLink("Host Hotels", vendor), "other");
  assert.equal(dependencies.normalizeResourceLinkLabel("Awards sponsor", vendor, pageText), "Awards sponsor");
});

test("a section heading cannot promote a generic HTML sponsor action to a hotel link", () => {
  dependencies.normalizeLinkLabel = () => "Click here";
  dependencies.extractDiscoveryAnchorContext = () => ({ heading: "Host Hotels", blockText: "Click here", contextText: "Host Hotels Click here" });
  loadCore("deriveDiscoveryAnchorLabel");
  const url = "https://sponsor.example/";
  const label = dependencies.deriveDiscoveryAnchorLabel("Click here", "", new URL(url), "", 0);
  assert.equal(dependencies.classifyResourceLink(label, url), "other");
});

test("real booking URLs and explicitly labeled organizer hotel hubs retain their actions", () => {
  assert.equal(isHotelResourceLink({ url: booking }), true);
  assert.equal(isHotelResourceLink({ url: hub, label: "Host Hotel Information" }), true);
  assert.equal(isHotelResourceLink({ url: "https://custom.example/group/123", label: "Book here", contextText: "Hilton Hotel\nBook here" }), true);
  assert.equal(dependencies.classifyResourceLink("Host Hotel Information", hub), "travel_accommodation");
  const annotationLabel = dependencies.derivePdfAnnotationLabel({ url: booking, pageNumber: 1 }, [{ num: 1, text: pageText }]);
  assert.equal(dependencies.classifyResourceLink(annotationLabel, booking), "travel_accommodation");
  assert.equal(selectHotelResourceFallback([booking]), booking);
});

test("destination evidence excludes query parameters, fragments and unrelated URL substrings", () => {
  for (const url of [
    `${vendor}?target=https://organizer.example/hotels#Hotel`,
    "https://sponsor.example/?q=hotel",
    "https://sponsor.example/#travel",
    "https://nothotelvendor.example/",
    "https://sponsor.example/awards",
  ]) assert.equal(isHotelResourceLink({ url }), false, url);
  assert.equal(isHotelResourceLink({ url: "javascript:alert(1)", label: "Host hotels" }), false);
  assert.equal(isHotelResourceLink({ url: "https://sponsor.example/", contextText: pageText }), false);
});

test("hotel candidate detection rejects the awards vendor in page context and keeps good links", () => {
  const candidates = detectTravelAccommodationCandidates({
    source: "pdf", extractedText: `${pageText}\n${vendor}`,
    pages: [{ pageNumber: 1, text: `${pageText}\n${vendor}\nHost Hotels: ${hub}\nReservations: ${booking}` }],
    links: [
      { url: vendor, pageNumber: 1, contextText: pageText },
      { url: vendor, label: "Host Hotels", pageNumber: 1 },
      { url: hub, label: "Host Hotel Information", sourceUrl: "https://organizer.example/packet.pdf" },
      { url: booking, label: "Reserve Hotel Online" },
    ],
  });
  assert.equal(candidates.some((candidate) => candidate.url === vendor), false);
  assert.equal(candidates.some((candidate) => candidate.url === hub), true);
  assert.equal(candidates.some((candidate) => candidate.url === booking), true);
  assert.equal(selectFallbackTravelLink(candidates), hub);
});

function urlsIn(value: any): string[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) =>
    (key === "url" || key === "href") && typeof item === "string" ? [item] : urlsIn(item),
  );
}

for (const discovered of [true, false]) {
  test(`saved ${discovered ? "discovery" : "manual"} page suppresses stale awards hotel actions and preserves real hotels`, () => {
    const links = [
      { kind: "travel_accommodation", label: "Host Hotels", url: vendor, renderTarget: "hotels", audience: "public_attendee" },
      { kind: "travel_accommodation", label: "Host Hotel Information", url: hub, renderTarget: "hotels", audience: "public_attendee" },
    ];
    const discoverySource = discovered ? {
      workflow: "gymnastics", parseResult: {}, extractionMeta: { resourceLinks: links },
      publicPageSections: { travel: { title: "Hotels & Travel", body: "Hotels for families", fallbackLink: vendor, visibility: "visible", items: [{ name: "Marriott", bookingUrl: booking }] } },
    } : undefined;
    const content = buildGymMeetDiscoveryContent({
      eventData: { title: "Xcel State", links, discoverySource }, customFields: {},
      advancedSections: { logistics: { fallbackTravelLink: vendor, hotelInfo: "Hotels for families", hotels: [{ name: "Marriott", bookingUrl: booking }] } },
    });
    const urls = urlsIn(content);
    assert.equal(urls.includes(vendor), false);
    assert.equal(urls.includes(booking), true);
    assert.equal(urls.includes(hub), true);
  });
}

test("persisted fallback validation skips an awards supplier and uses a grounded organizer hub", () => {
  assert.equal(selectHotelResourceFallback([vendor, hub], [
    { url: vendor, label: "Host Hotels" }, { url: hub, label: "Host Hotel Information" },
  ]), hub);
});
