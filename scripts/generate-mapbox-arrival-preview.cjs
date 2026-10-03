// Local handout interpretation: Mapbox receives only the public park address and
// provider coordinates. No uploaded image or handout text leaves this machine.
require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const sharp = require("sharp");
async function main() {
  const { searchBuilderAddress } = loadTs("src/lib/livecard-address-server.ts");
  const { encodeScanArtworkWebp } = loadTs("src/lib/ocr/artwork-webp.ts");
  const query = "23937 Panama City Beach Parkway, Panama City Beach, FL 32413";
  const match = await searchBuilderAddress({ query });
  if (!match?.location)
    throw new Error(
      `Mapbox address match unavailable (${match?.candidates.length || 0} candidates).`,
    );
  const { latitude, longitude } = match.location;
  const view = { latitude, longitude, zoom: 16, width: 960, height: 640 };
  const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_API_KEY;
  const url = new URL(
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${longitude},${latitude},${view.zoom},0,0/960x640.webp`,
  );
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Mapbox static image HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const meta = await sharp(bytes).metadata();
  if (meta.format !== "webp" || meta.width !== 960 || meta.height !== 640)
    throw new Error("Invalid Mapbox image.");
  const source = await encodeScanArtworkWebp(fs.readFileSync(process.argv[2]));
  const map = {
    version: 1,
    status: "ready",
    sourceImage: `data:image/webp;base64,${source.toString("base64")}`,
    mapImage: `data:image/webp;base64,${bytes.toString("base64")}`,
    view,
    markers: [
      {
        label: "Parking",
        kind: "parking",
        note: "Handwritten marker beside the entrance loop. The handout also says to park by the Rec Hall and reserve the closest spaces for pumpkin-patch visitors; confirm the intended parking area.",
        point: null,
        confirmed: false,
      },
      {
        label: "Student drop-off",
        kind: "dropoff",
        note: "The handout marks a separate drop-off area farther down Camp Helen Road. Confirm its exact position before providing directions.",
        point: null,
        confirmed: false,
      },
    ],
  };
  const dir = path.resolve("output/arrival-map-preview");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "map-0.webp"), bytes);
  fs.writeFileSync(path.join(dir, "source-0.webp"), source);
  fs.writeFileSync(path.join(dir, "local-map.json"), JSON.stringify(map, null, 2));
  console.log(JSON.stringify({ status: map.status, view, output: dir }));
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
