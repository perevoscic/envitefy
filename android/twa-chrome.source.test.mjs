import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = readFileSync(
  join(__dirname, "app", "src", "main", "AndroidManifest.xml"),
  "utf8",
);
const colors = readFileSync(
  join(__dirname, "app", "src", "main", "res", "values", "colors.xml"),
  "utf8",
);
const styles = readFileSync(
  join(__dirname, "app", "src", "main", "res", "values", "styles.xml"),
  "utf8",
);
const buildGradle = readFileSync(join(__dirname, "app", "build.gradle"), "utf8");
const strings = readFileSync(
  join(__dirname, "app", "src", "main", "res", "values", "strings.xml"),
  "utf8",
);

test("android TWA sets white top status bar and purple bottom navigation bar", () => {
  assert.match(buildGradle, /com\.google\.androidbrowserhelper:androidbrowserhelper:2\.6\.2/);
  assert.match(manifest, /com\.google\.androidbrowserhelper\.trusted\.LauncherActivity/);
  assert.match(manifest, /android:name="asset_statements"/);
  assert.match(strings, /delegate_permission\/common\.handle_all_urls/);
  assert.match(colors, /name="envitefy_status_bar">#FFFFFF</);
  assert.match(colors, /name="envitefy_navigation_bar">#8D7BE9</);
  assert.match(manifest, /android\.support\.customtabs\.trusted\.STATUS_BAR_COLOR/);
  assert.match(manifest, /android\.support\.customtabs\.trusted\.NAVIGATION_BAR_COLOR/);
  assert.match(styles, /android:windowLightStatusBar">true</);
  assert.match(styles, /android:windowLightNavigationBar">false</);
});
