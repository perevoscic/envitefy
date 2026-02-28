type PrepareOcrUploadOptions = {
  maxDimension?: number;
  quality?: number;
  sizeThresholdBytes?: number;
};

function ensureJpegName(name: string): string {
  const trimmed = (name || "scan").trim();
  const withoutExt = trimmed.replace(/\.[^.]+$/, "") || "scan";
  return `${withoutExt}.jpg`;
}

async function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  quality: number
): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new File([blob], ensureJpegName(fileName), { type: "image/jpeg", lastModified: Date.now() }));
      },
      "image/jpeg",
      quality
    );
  });
}

export async function prepareFileForOcrUpload(
  incoming: File,
  options: PrepareOcrUploadOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? 1600;
  const quality = options.quality ?? 0.78;
  const sizeThresholdBytes = options.sizeThresholdBytes ?? 900 * 1024;

  // Capture bytes first so Android file handles don't go stale during async upload.
  const arrayBuffer = await incoming.arrayBuffer();
  const cloned = new File([arrayBuffer], incoming.name, {
    type: incoming.type || "application/octet-stream",
    lastModified: incoming.lastModified,
  });

  const isImage = cloned.type.startsWith("image/");
  const shouldSkipCompression =
    !isImage || /image\/gif|image\/svg\+xml/i.test(cloned.type);
  if (shouldSkipCompression) return cloned;

  if (typeof window === "undefined" || typeof document === "undefined") return cloned;

  try {
    const bitmap = await createImageBitmap(cloned);
    const longestSide = Math.max(bitmap.width, bitmap.height);
    const shouldResize = longestSide > maxDimension;
    const shouldReencode = cloned.size > sizeThresholdBytes;

    if (!shouldResize && !shouldReencode) {
      bitmap.close();
      return cloned;
    }

    const scale = shouldResize ? maxDimension / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return cloned;
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();
    const compressed = await canvasToJpegFile(canvas, cloned.name, quality);
    if (compressed && compressed.size > 0 && compressed.size < cloned.size) {
      return compressed;
    }
    return cloned;
  } catch {
    return cloned;
  }
}
