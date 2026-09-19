import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const resources = resolve(root, "android/app/src/main/res");

// Copy the canonical artwork unchanged; do not redraw or recolor the brand asset.
for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
  const destination = resolve(resources, `mipmap-${density}`);
  mkdirSync(destination, { recursive: true });
  copyFileSync(resolve(root, `public/icons/icon-${size}.png`), resolve(destination, "ic_launcher.png"));
}
mkdirSync(resolve(resources, "drawable-nodpi"), { recursive: true });
copyFileSync(resolve(root, "public/icons/android-foreground.png"), resolve(resources, "drawable-nodpi/envitefy_icon_foreground.png"));
console.log("Android launcher assets copied from public/icons; adaptive foreground color and background are set in XML.");
