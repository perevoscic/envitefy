import sharp from "sharp";

let pdfRenderDepsPromise: Promise<{
  pdfjs: any;
  createCanvas: (width: number, height: number) => any;
} | null> | null = null;

async function getPdfRenderDeps() {
  if (!pdfRenderDepsPromise) {
    pdfRenderDepsPromise = Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("@napi-rs/canvas"),
    ])
      .then(([pdfjs, canvasMod]) => ({
        pdfjs,
        createCanvas: (canvasMod as any).createCanvas,
      }))
      .catch(() => null);
  }
  return pdfRenderDepsPromise;
}

async function renderPdfPageToPngWithPdfJs(
  pdfBuffer: Buffer,
  pageIndex: number,
  scale = 1.75,
): Promise<Buffer | null> {
  const deps = await getPdfRenderDeps();
  if (!deps) return null;
  try {
    const loadingTask = deps.pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true,
    });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });
    const width = Math.max(1, Math.ceil(viewport.width));
    const height = Math.max(1, Math.ceil(viewport.height));
    const canvas = deps.createCanvas(width, height);
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport }).promise;
    const png = canvas.toBuffer("image/png");
    if (typeof page.cleanup === "function") page.cleanup();
    if (typeof doc.cleanup === "function") doc.cleanup();
    if (typeof doc.destroy === "function") await doc.destroy();
    return Buffer.isBuffer(png) ? png : Buffer.from(png);
  } catch {
    return null;
  }
}

/**
 * Rasterize a single PDF page to PNG. Used before vision/LLM OCR so models never receive raw PDF bytes.
 */
export async function rasterizePdfPageToPng(
  pdfBuffer: Buffer,
  pageIndex: number,
): Promise<Buffer | null> {
  const sharpPageImage = await sharp(pdfBuffer, { density: 220, page: pageIndex })
    .png()
    .toBuffer()
    .catch(() => null);
  return sharpPageImage || (await renderPdfPageToPngWithPdfJs(pdfBuffer, pageIndex));
}
