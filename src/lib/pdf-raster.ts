import sharp from "sharp";

export type PdfAnnotationLink = {
  url: string;
  label: string | null;
  pageNumber: number;
  source: "pdf_annotation";
};

export const PDF_TEXT_ENGINE_LABEL = "pdfjs-dist";
export const PDF_WORKER_DISABLED = true;

let pdfJsPromise: Promise<any | null> | null = null;
let pdfRenderDepsPromise: Promise<{
  pdfjs: any;
  createCanvas: (width: number, height: number) => any;
} | null> | null = null;
const loggedPdfWarnings = new Set<string>();

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeHttpUrl(value: unknown): string {
  const raw = safeString(value);
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) return "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function formatPdfRuntimeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");
  const firstLine = message.split(/\r?\n+/).find((line) => line.trim()) || "";
  return firstLine.replace(/\s+/g, " ").trim() || "unknown-pdf-runtime-error";
}

function logPdfWarning(scope: string, error: unknown) {
  const message = formatPdfRuntimeError(error);
  const key = `${scope}:${message}`;
  if (loggedPdfWarnings.has(key)) return;
  loggedPdfWarnings.add(key);
  console.warn(`[pdf-raster] ${scope}`, { message });
}

async function getPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").catch((error) => {
      logPdfWarning("pdfjs import failed", error);
      return null;
    });
  }
  return pdfJsPromise;
}

function getServerPdfDocument(pdfjs: any, pdfBuffer: Buffer) {
  return pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
    disableWorker: PDF_WORKER_DISABLED,
  });
}

function normalizePdfJsPageText(items: unknown): string {
  const chunks: string[] = [];
  for (const item of Array.isArray(items) ? items : []) {
    const text = safeString((item as any)?.str);
    if (text) chunks.push(text);
    chunks.push((item as any)?.hasEOL ? "\n" : " ");
  }
  return chunks
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function getPdfRenderDeps() {
  if (!pdfRenderDepsPromise) {
    pdfRenderDepsPromise = Promise.all([getPdfJs(), import("@napi-rs/canvas")])
      .then(([pdfjs, canvasMod]) =>
        pdfjs
          ? {
              pdfjs,
              createCanvas: (canvasMod as any).createCanvas,
            }
          : null
      )
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
    const loadingTask = getServerPdfDocument(deps.pdfjs, pdfBuffer);
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
  } catch (error) {
    logPdfWarning(`pdfjs raster fallback failed for page ${pageIndex + 1}`, error);
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

export async function extractPdfAnnotationLinks(
  pdfBuffer: Buffer,
): Promise<PdfAnnotationLink[]> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) return [];

  let doc: any = null;
  try {
    const loadingTask = getServerPdfDocument(pdfjs, pdfBuffer);
    doc = await loadingTask.promise;
    const links: PdfAnnotationLink[] = [];
    const seen = new Set<string>();
    const pageCount = Number(doc.numPages) || 0;
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      try {
        const annotations = await page.getAnnotations();
        for (const annotation of Array.isArray(annotations) ? annotations : []) {
          const url = normalizeHttpUrl(
            annotation?.url ||
              annotation?.unsafeUrl ||
              annotation?.action?.url ||
              annotation?.action?.unsafeUrl,
          );
          if (!url) continue;
          const key = `${pageNumber}|${url}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const label =
            safeString(annotation?.title) ||
            safeString(annotation?.contents) ||
            safeString(annotation?.fieldName) ||
            null;
          links.push({
            url,
            label,
            pageNumber,
            source: "pdf_annotation",
          });
        }
      } finally {
        if (typeof page.cleanup === "function") page.cleanup();
      }
    }
    return links;
  } catch (error) {
    logPdfWarning("pdf annotation extraction failed", error);
    return [];
  } finally {
    if (doc) {
      if (typeof doc.cleanup === "function") doc.cleanup();
      if (typeof doc.destroy === "function") await doc.destroy();
    }
  }
}

export async function extractPdfTextWithPdfJs(
  pdfBuffer: Buffer,
): Promise<{ text: string; pages: Array<{ num: number; text: string }> }> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) return { text: "", pages: [] };

  let doc: any = null;
  try {
    const loadingTask = getServerPdfDocument(pdfjs, pdfBuffer);
    doc = await loadingTask.promise;
    const pages: Array<{ num: number; text: string }> = [];
    const pageCount = Number(doc.numPages) || 0;
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      try {
        const textContent = await page.getTextContent();
        const text = normalizePdfJsPageText(textContent?.items);
        if (!text) continue;
        pages.push({ num: pageNumber, text });
      } finally {
        if (typeof page.cleanup === "function") page.cleanup();
      }
    }
    return {
      text: pages.map((page) => page.text).join("\n\n"),
      pages,
    };
  } catch (error) {
    logPdfWarning("pdf text extraction failed", error);
    return { text: "", pages: [] };
  } finally {
    if (doc) {
      if (typeof doc.cleanup === "function") doc.cleanup();
      if (typeof doc.destroy === "function") await doc.destroy();
    }
  }
}
