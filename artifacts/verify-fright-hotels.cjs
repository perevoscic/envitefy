const fs = require("node:fs");
const ts = require("typescript");
const { registerHooks } = require("node:module");
registerHooks({
  resolve(specifier, context, next) {
    try { return next(specifier, context); }
    catch (error) {
      if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) return next(`${specifier}.ts`, context);
      throw error;
    }
  },
  load(url, context, next) {
    if (url.startsWith("file:") && url.endsWith(".ts") && !url.includes("/node_modules/")) return { format: "module", source: ts.transpileModule(fs.readFileSync(new URL(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText, shortCircuit: true };
    return next(url, context);
  },
});
(async () => {
  // Verify browser extraction without making a paid model request.
  delete process.env.OPENAI_API_KEY;
  const { extractHotelsWithPlaywright } = await import("../src/lib/travel-accommodation-providers/playwright.ts");
  const result = await extractHotelsWithPlaywright("https://usacompetitions.com/south-florida-fright-invite/", { signal: AbortSignal.timeout(20000), timeoutMs: 20000 });
  const report = { checkedAt: new Date().toISOString(), attempt: result.attempt, hotels: result.hotels };
  fs.writeFileSync("artifacts/fright-invite-hotels-live.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ hotelCount: report.hotels.length, hotels: report.hotels.map(hotel => ({ name: hotel.name, rate: hotel.groupRate, bookingUrl: hotel.bookingUrl, deadline: hotel.reservationDeadline, notes: hotel.notes })) }));
  if (report.hotels.length !== 1 || !report.hotels[0].bookingUrl || !report.hotels[0].groupRate) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
