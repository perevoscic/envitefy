import { findUserAwaitingGoogleAvatar, saveGoogleProfileAvatarIfUnset } from "@/lib/db";
import { uploadPrivateBinaryAsset } from "@/lib/media-upload";
import { renderProfileAvatarWebp } from "@/lib/profile-avatar-image";

const GOOGLE_PROFILE_IMAGE_HOST = /(^|\.)googleusercontent\.com$/i;
const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/octet-stream"]);
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

export function isAllowedGoogleProfileImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      GOOGLE_PROFILE_IMAGE_HOST.test(url.hostname)
    );
  } catch {
    return false;
  }
}

export function readGoogleProfileImageUrl(
  profile: unknown,
  user: { image?: string | null },
): string | null {
  const record = profile && typeof profile === "object" ? (profile as Record<string, unknown>) : {};
  const candidates = [record.picture, user.image];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && isAllowedGoogleProfileImageUrl(candidate.trim())) {
      return candidate.trim();
    }
  }
  return null;
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<Buffer | null> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!response.body) {
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length > 0 && bytes.length <= maxBytes ? bytes : null;
  }
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(Buffer.from(value));
  }
  return total > 0 ? Buffer.concat(chunks) : null;
}

async function downloadGoogleProfileImage(imageUrl: string): Promise<Buffer | null> {
  const response = await fetch(imageUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "image/jpeg,image/png,image/webp" },
  });
  if (!response.ok) return null;
  const type = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (type && !PROFILE_IMAGE_TYPES.has(type)) return null;
  return readLimitedBody(response, MAX_PROFILE_IMAGE_BYTES);
}

/** Copy a Google profile photo only when the account has no photo. An Envitefy photo, including one that replaced Google, stays. */
export async function applyGoogleProfileAvatarIfEmpty(params: {
  email: string;
  imageUrl: string | null;
}): Promise<void> {
  const imageUrl = params.imageUrl?.trim() || "";
  if (!isAllowedGoogleProfileImageUrl(imageUrl)) return;
  try {
    const eligible = await findUserAwaitingGoogleAvatar(params.email);
    if (!eligible) return;
    const source = await downloadGoogleProfileImage(imageUrl);
    if (!source) return;
    const avatarBytes = await renderProfileAvatarWebp(source);
    const uploaded = await uploadPrivateBinaryAsset({
      bytes: avatarBytes,
      pathname: `profile-media/${eligible.id}/avatar-${Date.now()}.webp`,
      contentType: "image/webp",
    });
    await saveGoogleProfileAvatarIfUnset({ email: params.email, avatarUrl: uploaded.url });
  } catch (error) {
    const details = error && typeof error === "object" ? error : {};
    const code =
      "code" in details && typeof details.code === "string" && /^[A-Z0-9_]{1,32}$/.test(details.code)
        ? details.code
        : "AVATAR_ERROR";
    console.error("[profile-avatar] Google profile image was not saved", { code });
  }
}
