import { describe, expect, test } from "bun:test";
import {
  PROFILE_AVATAR_MAX_BYTES,
  PROFILE_AVATAR_MIME_TYPES,
  validateProfileAvatarMeta,
} from "./profile-avatar";

describe("profile avatar validation", () => {
  test("accepts supported images at the 5 MB boundary", () => {
    for (const type of PROFILE_AVATAR_MIME_TYPES) {
      expect(validateProfileAvatarMeta({ type, size: PROFILE_AVATAR_MAX_BYTES })).toEqual({
        ok: true,
      });
    }
  });

  test("rejects oversized images", () => {
    expect(
      validateProfileAvatarMeta({ type: "image/png", size: PROFILE_AVATAR_MAX_BYTES + 1 }),
    ).toEqual({
      ok: false,
      error: "Profile images must be 5 MB or smaller.",
      status: 413,
    });
  });

  test("rejects unsupported and empty files", () => {
    expect(validateProfileAvatarMeta({ type: "image/gif", size: 100 })).toMatchObject({
      ok: false,
      status: 415,
    });
    expect(validateProfileAvatarMeta({ type: "image/png", size: 0 })).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

