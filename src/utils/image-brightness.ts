"use client";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

export async function isImageBottomAreaLight(src: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined" || !src) return false;

  try {
    const image = await loadImage(src);
    const sampleWidth = 24;
    const sampleHeight = 24;
    const canvas = document.createElement("canvas");
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return false;

    context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);

    let luminanceTotal = 0;
    let sampledPixels = 0;
    for (let y = Math.floor(sampleHeight * 0.52); y < sampleHeight; y += 1) {
      for (let x = Math.floor(sampleWidth * 0.12); x < Math.ceil(sampleWidth * 0.88); x += 1) {
        const index = (y * sampleWidth + x) * 4;
        const alpha = data[index + 3] / 255;
        if (alpha <= 0.05) continue;
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        luminanceTotal += (0.2126 * red + 0.7152 * green + 0.0722 * blue) * alpha;
        sampledPixels += 1;
      }
    }

    if (!sampledPixels) return false;
    return luminanceTotal / sampledPixels >= 168;
  } catch {
    return false;
  }
}
