import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

const PREFIX = "/__campaign-media/";
const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};
function inside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return Boolean(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

/** Resolve only explicitly enabled, owned development campaign media. */
export async function resolveCampaignSourceImage(
  value: string,
): Promise<{ mimeType: string; data: string } | null> {
  const configured = process.env.ENVITEFY_CAMPAIGN_RUNTIME_DIR;
  if (process.env.NODE_ENV !== "development" || !configured || !value.startsWith(PREFIX))
    return null;
  try {
    const url = new URL(value, "http://campaign.invalid");
    if (!url.pathname.startsWith(PREFIX)) return null;
    const relative = decodeURIComponent(url.pathname.slice(PREFIX.length));
    if (
      !relative ||
      relative.includes("\\") ||
      relative.split("/").some((part) => !part || part === "." || part === "..")
    )
      return null;
    const campaignRoot = await realpath(path.join(process.cwd(), ".qa", "create-campaign"));
    const runtimeRoot = await realpath(configured);
    if (!inside(campaignRoot, runtimeRoot)) return null;
    const marker: { kind?: string; runtimeDir?: string } = JSON.parse(
      await readFile(path.join(runtimeRoot, ".campaign-runtime.json"), "utf8"),
    );
    if (marker.kind !== "envitefy-create-campaign" || marker.runtimeDir !== runtimeRoot)
      return null;
    const blobRoot = await realpath(path.join(runtimeRoot, "blobs"));
    if (!inside(runtimeRoot, blobRoot)) return null;
    const file = await realpath(path.resolve(blobRoot, relative));
    if (!inside(blobRoot, file)) return null;
    const mimeType = MIME[path.extname(file).toLowerCase()];
    if (!mimeType) return null;
    const bytes = await readFile(file);
    if (bytes.length > 35 * 1024 * 1024) return null;
    return { mimeType, data: bytes.toString("base64") };
  } catch {
    return null;
  }
}
