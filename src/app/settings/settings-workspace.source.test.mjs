import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("settings uses a sectioned workspace instead of one continuous form", () => {
  assert.match(
    source,
    /type SettingsSectionKey = "profile" \| "calendars" \| "security" \| "creation"/,
  );
  assert.match(source, /SETTINGS_SECTIONS\.map/);
  assert.match(source, /aria-label="Settings sections"/);
  assert.match(source, /activeSettingsSection === "profile" \? "block" : "hidden"/);
  assert.match(source, /activeSettingsSection === "calendars" \? "block" : "hidden"/);
  assert.match(source, /activeSettingsSection === "security" \? "block" : "hidden"/);
  assert.match(source, /activeSettingsSection === "creation" \? "block" : "hidden"/);
});

test("sports deep links and compact preference grids remain available", () => {
  assert.match(source, /hash === "your-sports" \|\| hash === "creation"/);
  assert.match(source, /id="your-sports"/);
  assert.match(source, /SPORT_PREFERENCE_OPTIONS\.map/);
  assert.match(source, /sm:grid-cols-2 xl:grid-cols-3/);
  assert.match(source, /Save create settings/);
});

test("profile exposes a validated avatar upload experience", () => {
  assert.match(source, /PROFILE_AVATAR_ACCEPT/);
  assert.match(source, /validateProfileAvatarMeta\(file\)/);
  assert.match(source, /\/api\/user\/profile\/avatar/);
  assert.match(source, /Maximum file size: 5 MB/);
  assert.match(source, /Replace image/);
  assert.match(source, /removeAvatar/);
});

test("Google Calendar reconnect forces offline consent and returns to calendar settings", () => {
  assert.match(source, /\/api\/google\/auth\?consent=1&next=/);
  assert.match(source, /encodeURIComponent\("\/settings#calendars"\)/);
});
