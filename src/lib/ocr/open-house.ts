import sharp from "sharp";
import { processBufferUpload } from "@/lib/media-upload";
import type {
  OpenHouseExtractedField,
  OpenHouseOcrPayload,
  OpenHouseVisualAsset,
} from "@/lib/ocr/types";

export type OpenHousePropertyImage = {
  url: string;
  role?: string;
  label?: string;
};

export type NormalizedOpenHousePayload = Omit<OpenHouseOcrPayload, "visualAssets"> & {
  propertyImages?: OpenHousePropertyImage[];
  realtorImageUrl?: string | null;
};

const NAMED_OPEN_HOUSE_KEYS = new Set([
  "listingType",
  "propertyType",
  "price",
  "mlsNumber",
  "bedrooms",
  "bathrooms",
  "sqft",
  "lotSize",
  "yearBuilt",
  "parking",
  "hoa",
  "address",
  "neighborhood",
  "agencyName",
  "brokerageName",
  "realtorName",
  "realtorTitle",
  "realtorLicense",
  "realtorPhone",
  "realtorEmail",
  "websiteUrl",
  "listingUrl",
]);

function cleanString(value: unknown, maxLength = 240): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanKey(value: unknown): string | null {
  const cleaned = cleanString(value, 80);
  if (!cleaned) return null;
  return cleaned
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanList(value: unknown, limit: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => cleanString(item, 160))
    .filter((item): item is string => Boolean(item));
  return Array.from(new Set(items)).slice(0, limit);
}

function cleanExtractedFields(value: unknown, namedValues: Set<string>): OpenHouseExtractedField[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  const fields: OpenHouseExtractedField[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const label = cleanString(record.label, 80);
    const valueText = cleanString(record.value, 220);
    if (!label || !valueText) continue;
    const key = cleanKey(record.key || label);
    if (!key || NAMED_OPEN_HOUSE_KEYS.has(key)) continue;
    if (namedValues.has(valueText.toLowerCase())) continue;
    const dedupeKey = `${key}:${valueText.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const confidence = Number(record.confidence);
    fields.push({
      key,
      label,
      value: valueText,
      confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
    });
    if (fields.length >= 18) break;
  }
  return fields.length ? fields : undefined;
}

function cleanVisualAssets(value: unknown): OpenHouseVisualAsset[] {
  if (!Array.isArray(value)) return [];
  const assets: OpenHouseVisualAsset[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const role = cleanString(record.role, 40);
    const x = Number(record.x);
    const y = Number(record.y);
    const width = Number(record.width);
    const height = Number(record.height);
    if (!role || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
      continue;
    }
    const confidence = Number(record.confidence);
    assets.push({
      role,
      label: cleanString(record.label, 80),
      x,
      y,
      width,
      height,
      confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
    });
  }
  return assets.slice(0, 12);
}

export function normalizeOpenHousePayload(input: unknown): NormalizedOpenHousePayload | null {
  if (!input || typeof input !== "object") return null;
  const source = input as Record<string, unknown>;
  const base: NormalizedOpenHousePayload = {
    listingType: cleanString(source.listingType, 40) || "unknown",
    propertyType: cleanString(source.propertyType, 80),
    price: cleanString(source.price, 80),
    mlsNumber: cleanString(source.mlsNumber, 80),
    bedrooms: cleanString(source.bedrooms, 40),
    bathrooms: cleanString(source.bathrooms, 40),
    sqft: cleanString(source.sqft, 60),
    lotSize: cleanString(source.lotSize, 80),
    yearBuilt: cleanString(source.yearBuilt, 40),
    parking: cleanString(source.parking, 120),
    hoa: cleanString(source.hoa, 80),
    address: cleanString(source.address, 220),
    neighborhood: cleanString(source.neighborhood, 120),
    agencyName: cleanString(source.agencyName, 120),
    brokerageName: cleanString(source.brokerageName, 120),
    realtorName: cleanString(source.realtorName, 120),
    realtorTitle: cleanString(source.realtorTitle, 120),
    realtorLicense: cleanString(source.realtorLicense, 100),
    realtorPhone: cleanString(source.realtorPhone, 80),
    realtorEmail: cleanString(source.realtorEmail, 120),
    websiteUrl: cleanString(source.websiteUrl, 220),
    listingUrl: cleanString(source.listingUrl, 220),
    features: cleanList(source.features, 12),
  };

  const namedValues = new Set(
    Object.entries(base)
      .filter(([key, value]) => key !== "features" && typeof value === "string")
      .map(([, value]) => String(value).toLowerCase()),
  );
  const extractedFields = cleanExtractedFields(source.extractedFields, namedValues);
  if (extractedFields?.length) base.extractedFields = extractedFields;

  const visualAssets = cleanVisualAssets(source.visualAssets);
  if (visualAssets.length) {
    (base as OpenHouseOcrPayload).visualAssets = visualAssets;
  }

  const hasAnyValue = Object.entries(base).some(([key, value]) => {
    if (key === "listingType" && value === "unknown") return false;
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === "string" && value.trim().length > 0;
  });
  return hasAnyValue ? base : null;
}

function clampCrop(asset: OpenHouseVisualAsset, imageWidth: number, imageHeight: number, expand = 0) {
  const sourceX = Math.max(0, Math.min(1, Number(asset.x)));
  const sourceY = Math.max(0, Math.min(1, Number(asset.y)));
  const sourceWidth = Math.max(0, Math.min(1 - sourceX, Number(asset.width)));
  const sourceHeight = Math.max(0, Math.min(1 - sourceY, Number(asset.height)));
  const centerX = sourceX + sourceWidth / 2;
  const centerY = sourceY + sourceHeight / 2;
  const expandedWidth = Math.min(1, sourceWidth * (1 + expand));
  const expandedHeight = Math.min(1, sourceHeight * (1 + expand));
  const x = Math.max(0, Math.min(1 - expandedWidth, centerX - expandedWidth / 2));
  const y = Math.max(0, Math.min(1 - expandedHeight, centerY - expandedHeight / 2));
  const width = Math.min(1 - x, expandedWidth);
  const height = Math.min(1 - y, expandedHeight);
  if (!Number.isFinite(x + y + width + height) || width < 0.06 || height < 0.06) return null;
  const left = Math.max(0, Math.floor(x * imageWidth));
  const top = Math.max(0, Math.floor(y * imageHeight));
  const cropWidth = Math.max(1, Math.min(imageWidth - left, Math.round(width * imageWidth)));
  const cropHeight = Math.max(1, Math.min(imageHeight - top, Math.round(height * imageHeight)));
  if (cropWidth < 80 || cropHeight < 80) return null;
  return { left, top, width: cropWidth, height: cropHeight };
}

function clampRealtorPortraitCrop(asset: OpenHouseVisualAsset, imageWidth: number, imageHeight: number) {
  const crop = clampCrop(asset, imageWidth, imageHeight, 0.72);
  if (!crop) return null;

  const minSide = Math.min(imageWidth, imageHeight) * 0.1;
  const minWidth = Math.max(96, Math.round(minSide));
  const minHeight = Math.max(112, Math.round(minSide * 1.18));
  const centerX = crop.left + crop.width / 2;
  const centerY = crop.top + crop.height / 2;
  const targetWidth = Math.max(crop.width, minWidth);
  const targetHeight = Math.max(crop.height, minHeight, Math.round(targetWidth * 0.95));
  const left = Math.max(0, Math.min(imageWidth - 1, Math.round(centerX - targetWidth / 2)));
  const top = Math.max(0, Math.min(imageHeight - 1, Math.round(centerY - targetHeight / 2)));
  const width = Math.max(1, Math.min(imageWidth - left, Math.round(targetWidth)));
  const height = Math.max(1, Math.min(imageHeight - top, Math.round(targetHeight)));
  if (width < 80 || height < 80) return null;
  return { left, top, width, height };
}

export async function uploadOpenHouseVisualAssets(params: {
  imageBytes: Buffer;
  scanAttemptId?: string | null;
  openHouse: NormalizedOpenHousePayload | null;
}): Promise<NormalizedOpenHousePayload | null> {
  const openHouse = params.openHouse;
  const visualAssets = (openHouse as OpenHouseOcrPayload | null)?.visualAssets;
  if (!openHouse || !Array.isArray(visualAssets) || visualAssets.length === 0) return openHouse;

  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(params.imageBytes).metadata();
    width = meta.width || 0;
    height = meta.height || 0;
  } catch {
    return openHouse;
  }
  if (!width || !height) return openHouse;

  let realtorImageUrl: string | null = null;
  const tokenBase = cleanKey(params.scanAttemptId || "") || `scan-${Date.now()}`;

  for (let index = 0; index < visualAssets.length; index += 1) {
    const asset = visualAssets[index];
    const role = cleanString(asset.role, 40) || "property-other";
    const isRealtor = role === "realtor-headshot";
    if (isRealtor && realtorImageUrl) continue;
    if (!isRealtor) continue;

    const crop = clampRealtorPortraitCrop(asset, width, height);
    if (!crop) continue;
    try {
      const bytes = await sharp(params.imageBytes).extract(crop).png().toBuffer();
      const upload = await processBufferUpload({
        bytes,
        fileName: `open-house-${role}-${index + 1}.png`,
        mimeType: "image/png",
        usage: "header",
        uploadToken: `${tokenBase}-open-house-${isRealtor ? "realtor" : "property"}-${index + 1}`,
        scanAttemptId: params.scanAttemptId,
      });
      const url = upload.stored.display?.url || upload.eventMedia.thumbnail || "";
      if (!url) continue;
      if (isRealtor) {
        realtorImageUrl = url;
      }
    } catch {}
  }

  const next: NormalizedOpenHousePayload = { ...openHouse };
  delete (next as OpenHouseOcrPayload).visualAssets;
  delete next.propertyImages;
  if (realtorImageUrl) next.realtorImageUrl = realtorImageUrl;
  return next;
}
