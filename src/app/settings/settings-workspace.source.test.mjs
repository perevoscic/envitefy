import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const profileRouteSource = readFileSync(
  new URL("../api/user/profile/route.ts", import.meta.url),
  "utf8",
);
const eventActionsSource = readFileSync(
  new URL("../../components/EventActions.tsx", import.meta.url),
  "utf8",
);
const firstScanPromptSource = readFileSync(
  new URL("../../components/FirstScanCalendarPrompt.tsx", import.meta.url),
  "utf8",
);
const menuContextSource = readFileSync(
  new URL("../../contexts/MenuContext.tsx", import.meta.url),
  "utf8",
);
const leftSidebarControllerSource = readFileSync(
  new URL("../left-sidebar.controller.ts", import.meta.url),
  "utf8",
);
const disconnectRouteSource = readFileSync(
  new URL("../api/oauth/disconnect/route.ts", import.meta.url),
  "utf8",
);
const calendarsRouteSource = readFileSync(
  new URL("../api/calendars/route.ts", import.meta.url),
  "utf8",
);

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

test("only connected calendars can be selected and persisted as the default", () => {
  assert.match(source, /if \(!connectedCalendars\[provider\]\) return/);
  assert.match(source, /const isDisabled = !item\.connected/);
  assert.match(source, /const isDefault = preferredProvider === item\.key && !isDisabled/);
  assert.doesNotMatch(source, /item\.key !== "apple" && !item\.connected/);
  assert.match(source, /Apple Calendar remains available as a one-event/);

  assert.match(profileRouteSource, /if \(preferredProvider === "apple"\)/);
  assert.match(profileRouteSource, /getGoogleRefreshToken\(email\)/);
  assert.match(profileRouteSource, /getMicrosoftRefreshToken\(email\)/);
  assert.match(profileRouteSource, /Connect this calendar before setting it as your default/);
});

test("Apple remains an event-by-event action and never saves a default", () => {
  assert.match(eventActionsSource, /Remember a connected provider as my default calendar/);
  assert.doesNotMatch(eventActionsSource, /if \(provider === "apple"\) return true/);
  assert.match(firstScanPromptSource, /Add this event to Apple Calendar/);
  assert.match(firstScanPromptSource, /Apple events are added one at a time/);
  assert.doesNotMatch(firstScanPromptSource, /preferredProvider:\s*"apple"/);
});

test("calendar cards expose honest sync and disconnect states", () => {
  assert.doesNotMatch(source, /How Apple Calendar works/);
  assert.match(source, /Background sync unavailable/);
  assert.match(source, /<RefreshCw/);
  assert.match(source, /"Disconnect"/);
  assert.doesNotMatch(source, /window\.confirm/);
  assert.match(source, /fetch\("\/api\/oauth\/disconnect"/);
  assert.match(source, /Disconnecting…/);
  assert.match(source, /<Dialog\.Root/);
  assert.match(source, /<Dialog\.Title/);
  assert.match(source, /Keep connected/);
  assert.match(source, /Events already added to your/);
  assert.match(source, /onPointerDownOutside/);
});

test("provider disconnect removes only that calendar without ending the account session", () => {
  assert.match(disconnectRouteSource, /deleteStoredOAuthTokens\(authUser\.email, provider\)/);
  assert.match(disconnectRouteSource, /preferredProvider: null/);
  assert.match(disconnectRouteSource, /reauthenticationRequired: !provider/);
  assert.match(disconnectRouteSource, /provider === "google" \? "g_refresh" : "o_refresh"/);
  assert.match(calendarsRouteSource, /googleConnected = Boolean\(await getGoogleRefreshToken\(email\)\)/);
  assert.match(
    calendarsRouteSource,
    /microsoftConnected = Boolean\(await getMicrosoftRefreshToken\(email\)\)/,
  );
  assert.match(calendarsRouteSource, /apple: false/);
});

test("shared navigation waits for real connection status before clearing a default", () => {
  assert.match(menuContextSource, /fetch\("\/api\/calendars"/);
  assert.match(menuContextSource, /calendarConnectionsLoaded/);
  assert.match(leftSidebarControllerSource, /if \(!calendarConnectionsLoaded\) return/);
  assert.match(
    leftSidebarControllerSource,
    /if \(connectedCalendars\[defaultCalendarProvider\]\) return/,
  );
});
