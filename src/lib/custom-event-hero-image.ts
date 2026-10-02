// Local conversion only; uploads happen through the editor's explicit save.
export async function prepareCustomEventHeroImage(source: string): Promise<string> {
  const load = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be decoded. Choose another file."));
    image.src = url;
  });
  const image = await load(source);
  if (!image.naturalWidth || !image.naturalHeight)
    throw new Error("This image has no readable dimensions. Choose another file.");
  const scale = Math.min(1, 4000 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image. Please retry.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const webp = canvas.toDataURL("image/webp", 0.92);
  if (!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(webp) || webp.length > 12_000_000)
    throw new Error("This image could not be prepared as WebP. Try a smaller image or another browser.");
  const verified = await load(webp);
  if (verified.naturalWidth !== canvas.width || verified.naturalHeight !== canvas.height)
    throw new Error("The prepared image could not be verified. Choose another file.");
  return webp;
}
