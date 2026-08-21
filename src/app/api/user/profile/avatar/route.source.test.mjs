import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const profileRoute = readFileSync(new URL("../route.ts", import.meta.url), "utf8");
const blobRoute = readFileSync(new URL("../../../blob/[...path]/route.ts", import.meta.url), "utf8");
const db = readFileSync(new URL("../../../../../lib/db.ts", import.meta.url), "utf8");

test("avatar uploads are authenticated, optimized, and persisted", () => {
  assert.match(route, /getAuthenticatedRequestUser\(req\)/);
  assert.match(route, /validateProfileAvatarMeta\(file\)/);
  assert.match(route, /\.resize\(512, 512, \{ fit: "cover", position: "attention" \}\)/);
  assert.match(route, /\.webp\(\{ quality: 88 \}\)/);
  assert.match(route, /profile-media\/\$\{user\.id\}\/avatar-/);
  assert.match(route, /uploadPrivateBinaryAsset/);
  assert.match(route, /updateUserAvatarByEmail/);
});

test("persisted private avatars can be loaded through the blob proxy", () => {
  assert.match(blobRoute, /"event-media\/", "profile-media\/"/);
});

test("profile reads and removal preserve the avatar contract", () => {
  assert.match(route, /export async function DELETE/);
  assert.match(route, /avatarUrl: null/);
  assert.match(profileRoute, /avatarUrl: user\?\.avatar_url \|\| null/);
  assert.match(db, /alter table users add column if not exists avatar_url text/);
  assert.match(db, /export async function updateUserAvatarByEmail/);
});
