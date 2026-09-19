/** Download the already accepted export. This path never generates or redraws artwork. */
export async function downloadArtwork(imageUrl: string, title: string): Promise<void> {
  if (!imageUrl || !/^(?:https?:|data:image\/|blob:|\/)/i.test(imageUrl)) throw new Error("The artwork is not available to download.");
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("The artwork could not be downloaded. Please try again.");
  const blob = await response.blob();
  const extensions: Record<string, string> = { "image/png": "png", "image/webp": "webp", "image/jpeg": "jpg" };
  const extension = extensions[blob.type.split(";")[0]];
  if (!extension || !blob.size) throw new Error("The download did not contain a supported image.");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.trim().replace(/[^\p{L}\p{N}._-]+/gu, "-").slice(0, 100) || "envitefy-flyer"}.${extension}`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
