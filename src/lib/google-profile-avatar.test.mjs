import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function load(filename, mocks = {}) {
  const source = readFileSync(filename, "utf8");
  const code = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith("@/") || name.startsWith(".")) {
      let target = name.startsWith("@/")
        ? path.resolve("src", name.slice(2))
        : path.resolve(path.dirname(filename), name);
      if (!path.extname(target)) target += existsSync(`${target}.ts`) ? ".ts" : ".tsx";
      return load(target, mocks);
    }
    return require(name);
  };
  new Function("require", "module", "exports", code)(localRequire, module, module.exports);
  return module.exports;
}

test("Google profile image addresses stay on Google's image host", () => {
  const { isAllowedGoogleProfileImageUrl, readGoogleProfileImageUrl } = load(
    "src/lib/google-profile-avatar.ts",
    {
      "@/lib/db": {},
      "@/lib/media-upload": {},
      "@/lib/profile-avatar-image": {},
    },
  );
  const picture = "https://lh3.googleusercontent.com/a/example=s96-c";
  assert.equal(isAllowedGoogleProfileImageUrl(picture), true);
  assert.equal(isAllowedGoogleProfileImageUrl("http://lh3.googleusercontent.com/a/example"), false);
  assert.equal(isAllowedGoogleProfileImageUrl("https://evil.example/a.png"), false);
  assert.equal(isAllowedGoogleProfileImageUrl("https://googleusercontent.com.evil.example/a.png"), false);
  assert.equal(readGoogleProfileImageUrl({ picture }, { image: null }), picture);
  assert.equal(readGoogleProfileImageUrl({}, { image: "https://cdn.example/a.png" }), null);
});

test("an empty account receives a stored copy, and a chosen photo is left alone", async () => {
  const uploads = [];
  const saves = [];
  let awaiting = { id: "user-1" };
  const { applyGoogleProfileAvatarIfEmpty } = load("src/lib/google-profile-avatar.ts", {
    "@/lib/db": {
      findUserAwaitingGoogleAvatar: async () => awaiting,
      saveGoogleProfileAvatarIfUnset: async (params) => {
        saves.push(params);
        return true;
      },
    },
    "@/lib/media-upload": {
      uploadPrivateBinaryAsset: async (params) => {
        uploads.push(params);
        return { url: "/api/blob/profile-media/user-1/avatar.webp" };
      },
    },
    "@/lib/profile-avatar-image": {
      renderProfileAvatarWebp: async (bytes) => bytes,
    },
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(png, { status: 200, headers: { "content-type": "image/jpeg" } });
  try {
    await applyGoogleProfileAvatarIfEmpty({
      email: "Ava@Example.com",
      imageUrl: "https://lh3.googleusercontent.com/a/example",
    });
    assert.equal(uploads.length, 1);
    assert.match(uploads[0].pathname, /^profile-media\/user-1\/avatar-\d+\.webp$/);
    assert.equal(saves[0].email, "Ava@Example.com");
    assert.equal(saves[0].avatarUrl, "/api/blob/profile-media/user-1/avatar.webp");

    awaiting = null;
    await applyGoogleProfileAvatarIfEmpty({
      email: "Ava@Example.com",
      imageUrl: "https://lh3.googleusercontent.com/a/example",
    });
    assert.equal(uploads.length, 1);

    awaiting = { id: "user-1" };
    await applyGoogleProfileAvatarIfEmpty({
      email: "Ava@Example.com",
      imageUrl: "https://evil.example/a.png",
    });
    assert.equal(uploads.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("profile photos become a square WebP", async () => {
  const { renderProfileAvatarWebp } = load("src/lib/profile-avatar-image.ts");
  const webp = await renderProfileAvatarWebp(png);
  assert.equal(webp.subarray(0, 4).toString(), "RIFF");
  assert.equal(webp.subarray(8, 12).toString(), "WEBP");
});
