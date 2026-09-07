import assert from "node:assert/strict";
import test from "node:test";
import { resolveDashboardBrowserOrigin } from "./dashboard-origin.ts";

function browser(state = "prompt", position = { latitude: 41.88, longitude: -87.63 }) {
  const values = new Map();
  let locationCalls = 0;
  return {
    values,
    get locationCalls() {
      return locationCalls;
    },
    storage: { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) },
    permissions: { query: async () => ({ state }) },
    geolocation: {
      getCurrentPosition: (success, failure) => {
        locationCalls++;
        if (position) success({ coords: position });
        else failure({ code: 2 });
      },
    },
  };
}
const key = (identity) => `envitefy:dashboard:origin:${encodeURIComponent(identity)}`;
const saved = (overrides = {}) =>
  JSON.stringify({ lat: 41, lng: -88, savedAt: new Date().toISOString(), ...overrides });

test("automatic estimates obtain current location when browser permission is already granted", async () => {
  const device = browser("granted");
  assert.deepEqual(await resolveDashboardBrowserOrigin(" USER@example.com ", device), {
    lat: 41.88,
    lng: -87.63,
    label: "current location",
  });
  assert.equal(device.locationCalls, 1);
  assert.equal(JSON.parse(device.values.get(key("user@example.com"))).lat, 41.88);
});

test("automatic loading never prompts for permission, while the explicit location action can", async () => {
  for (const permission of ["prompt", "denied"]) {
    const device = browser(permission);
    assert.equal(await resolveDashboardBrowserOrigin("user", device), null);
    assert.equal(device.locationCalls, 0);
  }
  const device = browser();
  assert.equal(
    (await resolveDashboardBrowserOrigin("user", device, true)).label,
    "current location",
  );
  assert.equal(device.locationCalls, 1);
});

test("recent saved origins belong to the signed-in account, with no legacy shared origin reuse", async () => {
  const device = browser();
  device.values.set(key("first"), saved());
  device.values.set("envitefy:dashboard:last-origin:v1", saved());
  assert.deepEqual(await resolveDashboardBrowserOrigin("first", device), {
    lat: 41,
    lng: -88,
    label: "saved location",
  });
  assert.equal(await resolveDashboardBrowserOrigin("second", device), null);
  assert.equal(await resolveDashboardBrowserOrigin("", device), null);
});

test("the location action waits for a user's permission decision before finishing the estimate", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let acceptLocation;
  const device = browser();
  device.geolocation.getCurrentPosition = (success) => { acceptLocation = success; };
  let settled = false;
  const request = resolveDashboardBrowserOrigin("user", device, true);
  void request.then(() => { settled = true; });
  t.mock.timers.tick(30_000);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false, "a user can take more than 5.5 seconds to choose Allow");
  acceptLocation({ coords: { latitude: 41.88, longitude: -87.63 } });
  assert.equal((await request).label, "current location");
  assert.equal(JSON.parse(device.values.get(key("user"))).lat, 41.88);
});

test("stale, future-dated, malformed, and invalid saved coordinates cannot become an origin", async () => {
  const device = browser();
  for (const value of [
    "bad JSON",
    "null",
    saved({ lat: null }),
    saved({ lng: "" }),
    saved({ lat: 91 }),
    saved({ lng: 181 }),
    saved({ lat: false }),
    saved({ lat: [] }),
    saved({ savedAt: new Date(Date.now() - 61 * 60 * 1000).toISOString() }),
    saved({ savedAt: new Date(Date.now() + 60 * 1000).toISOString() }),
  ]) {
    device.values.set(key("user"), value);
    assert.equal(await resolveDashboardBrowserOrigin("user", device), null, value);
  }
  device.values.set(key("user"), saved({ lat: 0, lng: 0 }));
  assert.equal((await resolveDashboardBrowserOrigin("user", device)).lat, 0);
});

test("unavailable live location and unsupported permission queries fall back to a recent saved origin", async () => {
  const device = browser("granted", null);
  device.values.set(key("user"), saved());
  assert.equal((await resolveDashboardBrowserOrigin("user", device)).label, "saved location");
  device.permissions.query = async () => {
    throw new Error("unsupported");
  };
  assert.equal((await resolveDashboardBrowserOrigin("user", device)).label, "saved location");
  device.storage.getItem = () => {
    throw new Error("blocked");
  };
  device.storage.setItem = () => {
    throw new Error("blocked");
  };
  assert.equal(await resolveDashboardBrowserOrigin("user", device), null);
});
