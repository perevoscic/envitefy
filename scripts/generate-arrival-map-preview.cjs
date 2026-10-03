// Read supplied handout images through the actual extraction + Mapbox pipeline.
// No event record, upload or publication is performed. Outputs stay in /output/.
require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const loadTs = require("./lib/event-messages-test-loader.cjs");

async function main() {
  const inputs = process.argv.slice(2);
  if (!inputs.length || inputs.length > 5) throw new Error("Pass one to five handout image paths.");
  const informationImages = inputs.map(
    (file) => `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`,
  );
  const { generateEventTheme, parseEventThemeRequest } = loadTs(
    "src/lib/event-theme-generation.ts",
  );
  const result = await generateEventTheme(
    parseEventThemeRequest({
      mode: "information",
      category: "general",
      prompt:
        "Read the uploaded handout and map reference. Preserve every legible instruction and schedule entry. Create a Student Drop-Off & Parking section with the complete source map and distinct annotated parking and student drop-off markers. Retain the original annotated handout map when a separate close-up omits any marker. Do not invent missing details.",
      informationImages,
    }),
    AbortSignal.timeout(180_000),
  );
  const dir = path.resolve("output/arrival-map-preview");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "information.json"), JSON.stringify(result, null, 2));
  let count = 0;
  for (const section of result.details.sections) {
    if (!section.map) continue;
    const index = count++;
    for (const [name, data] of [
      ["source", section.map.sourceImage],
      ["map", section.map.mapImage],
    ]) {
      if (data)
        fs.writeFileSync(
          path.join(dir, `${name}-${index}.webp`),
          Buffer.from(data.split(",")[1], "base64"),
        );
    }
    console.log(
      JSON.stringify({
        title: section.title,
        status: section.map.status,
        view: section.map.view,
        markers: section.map.markers,
        output: dir,
      }),
    );
  }
  console.log(
    JSON.stringify({
      title: result.details.title,
      sections: result.details.sections.length,
      maps: count,
    }),
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
