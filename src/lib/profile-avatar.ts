export const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PROFILE_AVATAR_ACCEPT = PROFILE_AVATAR_MIME_TYPES.join(",");

export type ProfileAvatarValidation =
  | { ok: true }
  | { ok: false; error: string; status: 400 | 413 | 415 };

export function validateProfileAvatarMeta(file: {
  size: number;
  type: string;
}): ProfileAvatarValidation {
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, error: "Choose a profile image to upload.", status: 400 };
  }
  if (!(PROFILE_AVATAR_MIME_TYPES as readonly string[]).includes(file.type.toLowerCase())) {
    return { ok: false, error: "Profile images must be JPG, PNG, or WebP.", status: 415 };
  }
  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    return { ok: false, error: "Profile images must be 5 MB or smaller.", status: 413 };
  }
  return { ok: true };
}

