const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../../../../scripts/lib/event-messages-test-loader.cjs");

function harness({ authenticated = true, existing = true, failure, connected = true } = {}) {
  const calls = [];
  const row = {
    id: "current-user",
    email: "current@example.test",
    first_name: "Old",
    last_name: "Name",
    avatar_url: "/api/blob/profile-media/current-user/old.webp",
    preferred_provider: null,
    product_scopes: ["snap", "event_page"],
  };
  const update = async (method, changes) => {
    calls.push({ method, changes });
    if (failure === "update") throw new Error("database unavailable");
    if (Object.hasOwn(changes, "firstName")) row.first_name = changes.firstName;
    if (Object.hasOwn(changes, "lastName")) row.last_name = changes.lastName;
    if (Object.hasOwn(changes, "avatarUrl")) row.avatar_url = changes.avatarUrl;
    return { ...row };
  };
  const route = loadTs("src/app/api/user/profile/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/auth": {
      getAuthenticatedRequestUser: async () => authenticated
        ? { ok: true, email: row.email, session: { user: { name: "Old Name" } } }
        : { ok: false },
    },
    "@/lib/db": {
      getUserByEmail: async (email) => {
        calls.push({ method: "read", email });
        return existing ? { ...row } : null;
      },
      updateUserNamesByEmail: (changes) => update("names", changes),
      updateUserProfileByEmail: (changes) => update("profile", changes),
      getMicrosoftRefreshToken: async () => connected ? "microsoft-refresh" : null,
      updatePreferredProviderByEmail: async ({ preferredProvider }) => {
        calls.push({ method: "default", preferredProvider });
        row.preferred_provider = preferredProvider;
        return { ...row };
      },
    },
    "@/lib/google-calendar-connection": {
      getGoogleCalendarRefreshToken: async () => connected ? "google-refresh" : null,
    },
    "@/lib/profile-avatar-image": {
      renderProfileAvatarWebp: async (bytes) => {
        calls.push({ method: "render", bytes: bytes.toString() });
        if (failure === "render") throw new Error("invalid image");
        return Buffer.from("optimized-webp");
      },
    },
    "@/lib/media-upload-image": {
      uploadPrivateBinaryAsset: async (params) => {
        calls.push({ method: "upload", ...params });
        if (failure === "upload") throw new Error("storage unavailable");
        return {
          url: "/api/blob/profile-media/current-user/new.webp",
          rawBlobUrl: "https://private.blob.example/profile-media/current-user/new.webp",
          pathname: "profile-media/current-user/new.webp",
        };
      },
    },
    "@vercel/blob": {
      del: async (url) => { calls.push({ method: "delete", url }); },
    },
  });
  return {
    calls,
    row,
    form: (fields = {}, file) => {
      const data = new FormData();
      for (const [key, value] of Object.entries(fields)) data.set(key, value);
      if (file) data.set("avatar", file);
      return route.PUT(new Request("http://localhost/api/user/profile", { method: "PUT", body: data }));
    },
    json: (body) => route.PUT(new Request("http://localhost/api/user/profile", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })),
  };
}

const image = () => new File(["source-image"], "photo.png", { type: "image/png" });

test("staged profile saves authenticate before parsing images or writing anything", async () => {
  const signedOut = harness({ authenticated: false });
  assert.equal((await signedOut.form({ firstName: "New", avatarAction: "replace" }, image())).status, 401);
  assert.deepEqual(signedOut.calls, []);
  const missing = harness({ existing: false });
  assert.equal((await missing.form({ avatarAction: "replace" }, image())).status, 401);
  assert.deepEqual(missing.calls, [{ method: "read", email: "current@example.test" }]);
});

test("a staged replacement commits names and the optimized private image in one profile update", async () => {
  const state = harness();
  const response = await state.form({ firstName: "New", lastName: "", avatarAction: "replace", email: "other@example.test" }, image());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(state.calls.map((call) => call.method), ["read", "render", "upload", "profile"]);
  const upload = state.calls.find((call) => call.method === "upload");
  assert.equal(upload.bytes.toString(), "optimized-webp");
  assert.equal(upload.contentType, "image/webp");
  assert.match(upload.pathname, /^profile-media\/current-user\/avatar-\d+-[\w-]+\.webp$/);
  assert.deepEqual(state.calls.at(-1).changes, {
    email: "current@example.test", firstName: "New", lastName: null,
    avatarUrl: "/api/blob/profile-media/current-user/new.webp",
  });
  const payload = await response.json();
  assert.equal(payload.firstName, "New");
  assert.equal(payload.lastName, null);
  assert.equal(payload.avatarUrl, "/api/blob/profile-media/current-user/new.webp");
});

test("removing a photo commits its explicit clear with the names without an upload", async () => {
  const state = harness();
  const response = await state.form({ firstName: "New", avatarAction: "remove" });
  assert.equal(response.status, 200);
  assert.deepEqual(state.calls.map((call) => call.method), ["read", "profile"]);
  assert.deepEqual(state.calls.at(-1).changes, { email: "current@example.test", firstName: "New", avatarUrl: null });
  assert.equal((await response.json()).avatarUrl, null);
});

test("keeping a photo leaves the stored choice intact and missing names unchanged", async () => {
  for (const avatarAction of [undefined, "keep"]) {
    const state = harness();
    const fields = { firstName: "" };
    if (avatarAction) fields.avatarAction = avatarAction;
    const response = await state.form(fields);
    assert.equal(response.status, 200);
    assert.deepEqual(state.calls.at(-1).changes, { email: "current@example.test", firstName: null });
    assert.equal(state.row.last_name, "Name");
    assert.equal(state.row.avatar_url, "/api/blob/profile-media/current-user/old.webp");
  }
});

test("invalid staged images and contradictory mutations reject before image processing or profile writes", async () => {
  const scenarios = [
    { fields: { avatarAction: "replace", firstName: "New" }, file: undefined, status: 400 },
    { fields: { avatarAction: "replace" }, file: new File(["gif"], "photo.gif", { type: "image/gif" }), status: 415 },
    { fields: { avatarAction: "replace" }, file: new File([], "empty.png", { type: "image/png" }), status: 400 },
    { fields: { avatarAction: "replace" }, file: new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }), status: 413 },
    { fields: { avatarAction: "remove" }, file: image(), status: 400 },
    { fields: { avatarAction: "keep" }, file: image(), status: 400 },
    { fields: { avatarAction: "unknown" }, status: 400 },
    { fields: { firstName: image() }, status: 400 },
  ];
  for (const scenario of scenarios) {
    const state = harness();
    const response = await state.form(scenario.fields, scenario.file);
    assert.equal(response.status, scenario.status);
    assert.deepEqual(state.calls.map((call) => call.method), ["read"]);
    assert.equal(state.row.first_name, "Old");
    assert.equal(state.row.avatar_url, "/api/blob/profile-media/current-user/old.webp");
  }
});

test("failed image processing and uploads do not save names or remove the current photo", async (context) => {
  context.mock.method(console, "error", () => {});
  for (const failure of ["render", "upload"]) {
    const state = harness({ failure });
    const response = await state.form({ firstName: "New", avatarAction: "replace" }, image());
    assert.equal(response.status, 400);
    assert.equal(state.calls.some((call) => ["profile", "names", "delete"].includes(call.method)), false);
    assert.equal(state.row.first_name, "Old");
    assert.equal(state.row.avatar_url, "/api/blob/profile-media/current-user/old.webp");
  }
});

test("a failed profile commit removes only its new orphaned upload and keeps persisted fields", async (context) => {
  context.mock.method(console, "error", () => {});
  const state = harness({ failure: "update" });
  const response = await state.form({ firstName: "New", avatarAction: "replace" }, image());
  assert.equal(response.status, 400);
  assert.deepEqual(state.calls.at(-1), { method: "delete", url: "https://private.blob.example/profile-media/current-user/new.webp" });
  assert.equal(state.row.first_name, "Old");
  assert.equal(state.row.avatar_url, "/api/blob/profile-media/current-user/old.webp");
});

test("existing JSON name and calendar writes retain their contracts", async () => {
  const names = harness();
  assert.equal((await names.json({ firstName: "New", lastName: "", avatarUrl: "https://other.example/untrusted.png" })).status, 200);
  assert.deepEqual(names.calls.at(-1), { method: "names", changes: { email: "current@example.test", firstName: "New", lastName: null } });
  assert.equal(names.row.avatar_url, "/api/blob/profile-media/current-user/old.webp");
  const connected = harness();
  assert.equal((await connected.json({ preferredProvider: "google" })).status, 200);
  assert.equal(connected.row.preferred_provider, "google");
  for (const preferredProvider of ["google", "microsoft", "apple"]) {
    const state = harness({ connected: false });
    assert.equal((await state.json({ firstName: "New", preferredProvider })).status, 400);
    assert.deepEqual(state.calls.map((call) => call.method), ["read"]);
  }
});
