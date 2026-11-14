const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("../../../scripts/lib/event-messages-test-loader.cjs");

test("a readable parent packet does not prevent opening the schedule PDF on a related page", async () => {
  const core = load("src/lib/meet-discovery/core.ts", { "@/lib/gcp": { getVisionClient: () => { throw Error("Unexpected OCR"); } } });
  const root = "https://meet.test/";
  const requested = [];
  const html = "<main><h1>2027 Atlanta Centennial Classic</h1><p>January 29–31, 2027 at Georgia International Convention Center.</p><a href='/parent-packet.pdf'>Parent information packet</a><a href='/schedule'>Schedule</a></main>";
  core.__testUtils.setUrlDiscoveryTestHooks({
    fetchWithLimit: async url => {
      requested.push(url);
      const pdf = /\.pdf$/.test(url);
      const text = url === root ? html : url.endsWith("/schedule") ? "<main><h1>2027 Atlanta Centennial Classic Schedule</h1><p>2027 girls travel schedule available.</p><a href='/s/2027travel.pdf'>2027 Girls Schedule - Travel</a></main>" : "";
      return { contentType: pdf ? "application/pdf" : "text/html", text, buffer: Buffer.from(pdf ? url : text), finalUrl: url };
    },
    collectBrowserData: async () => ({ pages: [], candidates: [] }),
    extractTextFromPdf: async bytes => ({ text: bytes.toString().includes("travel") ? "2027 Atlanta Centennial Classic Travel Schedule Friday January 29 Gym A Level 6-8" : "Parent venue and admission information. ".repeat(60), textQuality: "good", usedOcr: false, coachPageHints: [], pages: [], annotationLinks: [] }),
    extractGymLayoutImageFromPdf: async () => ({ dataUrl: null, facts: [], zones: [] }),
  });
  try {
    const result = await core.extractDiscoveryText({ type: "url", url: root }, { workflow: "gymnastics", mode: "enrich", budgetMs: 15000 });
    assert.ok(requested.includes(`${root}parent-packet.pdf`));
    assert.ok(requested.includes(`${root}s/2027travel.pdf`), "the nested schedule is opened after a complete parent packet");
    assert.match(result.extractedText, /Gym A Level 6-8/);
  } finally { core.__testUtils.resetUrlDiscoveryTestHooks(); }
});
