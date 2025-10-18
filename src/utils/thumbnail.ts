export async function createThumbnailDataUrl(
  sourceFile: File,
  maxSize: number = 1024,
  quality: number = 0.82
): Promise<string | null> {
  try {
    if (!sourceFile.type.startsWith("image/")) return null;
    const blobUrl = URL.createObjectURL(sourceFile);
    try {
      const img = document.createElement("img");
      const loaded: HTMLImageElement = await new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = blobUrl;
      });
      const { width, height } = loaded;
      const scale = Math.min(1, maxSize / Math.max(width, height));
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(loaded, 0, 0, targetWidth, targetHeight);
      return canvas.toDataURL("image/webp", quality);
    } finally {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }
  } catch {
    return null;
  }
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}
