// Tiny, dependency-free HEIC→JPEG + downscale for mobile uploads
// Must be called from a user gesture if it triggers the file picker

export type PreparedImage = {
  file: File; // JPEG to upload
  width: number;
  height: number;
  original: File; // original picked file
};

export async function pickAndPrepareImage(
  opts: { maxSide?: number; quality?: number; capture?: "user" | "environment" } = {}
): Promise<PreparedImage | null> {
  const { maxSide = 2000, quality = 0.85, capture } = opts;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  if (capture) (input as any).capture = capture;

  const file: File | null = await new Promise((resolve) => {
    input.onchange = () => resolve(input.files?.[0] ?? null);
    (input as any).oncancel = () => resolve(null);
    input.click();
  });
  if (!file) return null;

  return await preparePickedImage(file, { maxSide, quality });
}

export async function preparePickedImage(
  file: File,
  opts: { maxSide?: number; quality?: number } = {}
): Promise<PreparedImage> {
  const { maxSide = 2000, quality = 0.85 } = opts;

  // Decode into a bitmap (EXIF orientation applied when supported)
  const blob = file as Blob;
  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = (await createImageBitmap(blob as any, {
      imageOrientation: "from-image" as any,
    })) as unknown as ImageBitmap;
  } catch {
    // Fallback: decode via <img>
    const url = URL.createObjectURL(blob);
    try {
      bitmap = await new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = () => rej(new Error("Image decode failed"));
        img.src = url;
      });
    } finally {
      try { URL.revokeObjectURL(url); } catch {}
    }
  }

  const srcW = (bitmap as any).width as number;
  const srcH = (bitmap as any).height as number;

  // Compute target size (keep aspect, clamp longest side)
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));

  // Draw to canvas and export JPEG
  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap as any, 0, 0, dstW, dstH);

  const jpegBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))),
      "image/jpeg",
      quality
    );
  });

  const outName = (file.name.replace(/\.[^.]+$/, "") || "photo") + ".jpg";
  const outFile = new File([jpegBlob], outName, { type: "image/jpeg" });

  return { file: outFile, width: dstW, height: dstH, original: file };
}


