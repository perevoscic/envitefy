/** Re-encode an accepted image for sharing, preserving its original dimensions. */
async function prepareDownloadImage(blob: Blob): Promise<Blob> {
  if (blob.type.split(";")[0] === "image/jpeg") return blob;
  const sourceUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode().catch(() => {
      throw new Error("The artwork could not be opened. Please try downloading again.");
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the download.");
    // JPEG has no transparency; use white instead of an unexpected black matte.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        // Browsers that cannot encode JPEG fall back to the widely supported PNG.
        if (result?.size && ["image/jpeg", "image/png"].includes(result.type)) resolve(result);
        else reject(new Error("Your browser could not prepare the download. Please try again."));
      }, "image/jpeg", 0.95);
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

/** Download accepted artwork as JPEG, without generating artwork or saving an event. */
export async function downloadArtwork(imageUrl: string, title: string): Promise<void> {
  if (!imageUrl || !/^(?:https?:|data:image\/|blob:|\/)/i.test(imageUrl)) throw new Error("The artwork is not available to download.");
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("The artwork could not be downloaded. Please try again.");
  const blob = await response.blob();
  const extensions: Record<string, string> = { "image/png": "png", "image/webp": "webp", "image/jpeg": "jpg" };
  if (!extensions[blob.type.split(";")[0]] || !blob.size) throw new Error("The download did not contain a supported image.");
  const download = await prepareDownloadImage(blob);
  const extension = extensions[download.type.split(";")[0]];
  const url = URL.createObjectURL(download);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.trim().replace(/[^\p{L}\p{N}._-]+/gu, "-").slice(0, 100) || "envitefy-flyer"}.${extension}`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
