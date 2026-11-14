import { readVenuePhotoPermission, type VenuePhotoPermission } from "./venue-photo-permission";
export type VenuePhotoReference = { venue: string; sourceUrl: string; imageUrl: string; addressSourceUrl?: string; permission?: VenuePhotoPermission;
  permittedPhoto?: { sourceUrl: string; imageUrl: string; permission: VenuePhotoPermission } };
export type VenueWebsitePhoto = { url?: string; sourceUrl: string; permission?: VenuePhotoPermission; reference?: VenuePhotoReference };

const normalize = (value: unknown) => typeof value === "string"
  ? value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim() : "";
const publicHttps = (value: unknown): string | undefined => {
  if (typeof value !== "string" || value.length > 2000) return;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && !url.username && !url.password) return url.href;
  } catch { /* Invalid saved references never become image sources. */ }
};

/** This metadata is written only after the server verifies the source page and building image. */
export function readVenuePhotoReference(value: unknown): VenuePhotoReference | undefined {
  if (!value || typeof value !== "object") return;
  const raw = value as VenuePhotoReference;
  const sourceUrl = publicHttps(raw.sourceUrl), imageUrl = publicHttps(raw.imageUrl);
  if (!sourceUrl || !imageUrl || typeof raw.venue !== "string" || !raw.venue.trim() || raw.venue.length > 240) return;
  const permission = readVenuePhotoPermission(raw.permission, sourceUrl, imageUrl);
  const permittedSource = publicHttps(raw.permittedPhoto?.sourceUrl), permittedImage = publicHttps(raw.permittedPhoto?.imageUrl);
  const permittedProof = permittedSource && permittedImage && readVenuePhotoPermission(raw.permittedPhoto?.permission, permittedSource, permittedImage);
  return { venue: raw.venue, sourceUrl, imageUrl,
    ...(permission ? { permission } : {}),
    ...(permittedProof ? { permittedPhoto: { sourceUrl: permittedSource!, imageUrl: permittedImage!, permission: permittedProof } } : {}),
    ...(publicHttps(raw.addressSourceUrl) ? { addressSourceUrl: publicHttps(raw.addressSourceUrl) } : {}) };
}

/** Reuse the source photo without new research, image generation or paid Places requests. */
export function venueWebsitePhoto(venue: string, address: string,
  context: { venue?: string; address?: string } | undefined, reference: unknown): VenueWebsitePhoto | undefined {
  const photo = readVenuePhotoReference(reference);
  if (!photo || !normalize(venue) || !normalize(address) ||
    normalize(venue) !== normalize(context?.venue) || normalize(address) !== normalize(context?.address) ||
    normalize(venue) !== normalize(photo.venue)) return;
  if (photo.permittedPhoto) return { sourceUrl: photo.permittedPhoto.sourceUrl, url: photo.permittedPhoto.imageUrl, permission: photo.permittedPhoto.permission };
  return { sourceUrl: photo.sourceUrl, ...(photo.permission ? { url: photo.imageUrl, permission: photo.permission } : { reference: photo }) };
}
