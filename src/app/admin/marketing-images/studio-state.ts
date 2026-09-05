import type { StudioVersion } from "@/lib/admin/marketing-studio/types";

/** A working or failed revision must never displace the last usable result. */
export function choosePreviewVersion(
  versions: StudioVersion[],
  selected: StudioVersion | null,
): StudioVersion | null {
  const canPreview = (version: StudioVersion) =>
    version.status === "ready" &&
    Boolean(version.result) &&
    (version.output === "prompt" || Boolean(version.result?.assetId));
  if (selected && canPreview(selected)) return selected;
  return [...versions].reverse().find(canPreview) || null;
}
