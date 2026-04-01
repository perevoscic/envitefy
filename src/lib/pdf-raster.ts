import sharp from "sharp";

export type PdfAnnotationLink = {
  url: string;
  label: string | null;
  pageNumber: number;
  source: "pdf_annotation";
};

export const PDF_TEXT_ENGINE_LABEL = "pdfjs-dist";
export const PDF_WORKER_DISABLED = true;

export type PdfTextExtractionPage = {
  num: number;
  text: string;
};

export type PdfTextExtractionResult = {
  text: string;
  pages: PdfTextExtractionPage[];
};

let pdfJsPromise: Promise<any | null> | null = null;
let pdfRenderDepsPromise: Promise<{
  pdfjs: any;
  createCanvas: (width: number, height: number) => any;
} | null> | null = null;
let pdfJsGlobalsPromise: Promise<void> | null = null;
const loggedPdfWarnings = new Set<string>();

function toFiniteNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

type MatrixInput =
  | Iterable<number>
  | {
      a?: number;
      b?: number;
      c?: number;
      d?: number;
      e?: number;
      f?: number;
      m11?: number;
      m12?: number;
      m21?: number;
      m22?: number;
      m41?: number;
      m42?: number;
    };

class PdfJsDomMatrixShim {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  m11 = 1;
  m12 = 0;
  m13 = 0;
  m14 = 0;
  m21 = 0;
  m22 = 1;
  m23 = 0;
  m24 = 0;
  m31 = 0;
  m32 = 0;
  m33 = 1;
  m34 = 0;
  m41 = 0;
  m42 = 0;
  m43 = 0;
  m44 = 1;
  is2D = true;
  isIdentity = true;

  constructor(init?: MatrixInput | string) {
    if (typeof init === "string") {
      this.#sync();
      return;
    }
    const values = Array.isArray(init) ? init : init ? Array.from(init as Iterable<number>) : null;
    if (values?.length === 6) {
      this.a = toFiniteNumber(values[0], 1);
      this.b = toFiniteNumber(values[1], 0);
      this.c = toFiniteNumber(values[2], 0);
      this.d = toFiniteNumber(values[3], 1);
      this.e = toFiniteNumber(values[4], 0);
      this.f = toFiniteNumber(values[5], 0);
    } else if (values?.length === 16) {
      this.a = toFiniteNumber(values[0], 1);
      this.b = toFiniteNumber(values[1], 0);
      this.c = toFiniteNumber(values[4], 0);
      this.d = toFiniteNumber(values[5], 1);
      this.e = toFiniteNumber(values[12], 0);
      this.f = toFiniteNumber(values[13], 0);
    } else if (init && typeof init === "object") {
      const input = init as Exclude<MatrixInput, Iterable<number>>;
      this.a = toFiniteNumber(input.a ?? input.m11, 1);
      this.b = toFiniteNumber(input.b ?? input.m12, 0);
      this.c = toFiniteNumber(input.c ?? input.m21, 0);
      this.d = toFiniteNumber(input.d ?? input.m22, 1);
      this.e = toFiniteNumber(input.e ?? input.m41, 0);
      this.f = toFiniteNumber(input.f ?? input.m42, 0);
    }
    this.#sync();
  }

  static fromMatrix(init?: MatrixInput | string) {
    return new PdfJsDomMatrixShim(init);
  }

  #set(a: number, b: number, c: number, d: number, e: number, f: number) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    this.#sync();
    return this;
  }

  #sync() {
    this.m11 = this.a;
    this.m12 = this.b;
    this.m13 = 0;
    this.m14 = 0;
    this.m21 = this.c;
    this.m22 = this.d;
    this.m23 = 0;
    this.m24 = 0;
    this.m31 = 0;
    this.m32 = 0;
    this.m33 = 1;
    this.m34 = 0;
    this.m41 = this.e;
    this.m42 = this.f;
    this.m43 = 0;
    this.m44 = 1;
    this.isIdentity =
      this.a === 1 &&
      this.b === 0 &&
      this.c === 0 &&
      this.d === 1 &&
      this.e === 0 &&
      this.f === 0;
  }

  multiplySelf(other?: MatrixInput | string) {
    const rhs = new PdfJsDomMatrixShim(other);
    return this.#set(
      this.a * rhs.a + this.c * rhs.b,
      this.b * rhs.a + this.d * rhs.b,
      this.a * rhs.c + this.c * rhs.d,
      this.b * rhs.c + this.d * rhs.d,
      this.a * rhs.e + this.c * rhs.f + this.e,
      this.b * rhs.e + this.d * rhs.f + this.f,
    );
  }

  preMultiplySelf(other?: MatrixInput | string) {
    const lhs = new PdfJsDomMatrixShim(other);
    return this.#set(
      lhs.a * this.a + lhs.c * this.b,
      lhs.b * this.a + lhs.d * this.b,
      lhs.a * this.c + lhs.c * this.d,
      lhs.b * this.c + lhs.d * this.d,
      lhs.a * this.e + lhs.c * this.f + lhs.e,
      lhs.b * this.e + lhs.d * this.f + lhs.f,
    );
  }

  multiply(other?: MatrixInput | string) {
    return new PdfJsDomMatrixShim(this).multiplySelf(other);
  }

  translateSelf(tx = 0, ty = 0) {
    return this.multiplySelf([1, 0, 0, 1, tx, ty]);
  }

  translate(tx = 0, ty = 0) {
    return new PdfJsDomMatrixShim(this).translateSelf(tx, ty);
  }

  scaleSelf(scaleX = 1, scaleY = scaleX) {
    return this.multiplySelf([scaleX, 0, 0, scaleY, 0, 0]);
  }

  scale(scaleX = 1, scaleY = scaleX) {
    return new PdfJsDomMatrixShim(this).scaleSelf(scaleX, scaleY);
  }

  invertSelf() {
    const determinant = this.a * this.d - this.b * this.c;
    if (!Number.isFinite(determinant) || determinant === 0) {
      return this.#set(NaN, NaN, NaN, NaN, NaN, NaN);
    }
    const nextA = this.d / determinant;
    const nextB = -this.b / determinant;
    const nextC = -this.c / determinant;
    const nextD = this.a / determinant;
    const nextE = (this.c * this.f - this.d * this.e) / determinant;
    const nextF = (this.b * this.e - this.a * this.f) / determinant;
    return this.#set(nextA, nextB, nextC, nextD, nextE, nextF);
  }

  toFloat64Array() {
    return new Float64Array([
      this.a,
      this.b,
      0,
      0,
      this.c,
      this.d,
      0,
      0,
      0,
      0,
      1,
      0,
      this.e,
      this.f,
      0,
      1,
    ]);
  }
}

class PdfJsImageDataShim {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace = "srgb";

  constructor(dataOrWidth: Uint8ClampedArray | number, width?: number, height?: number) {
    if (dataOrWidth instanceof Uint8ClampedArray) {
      this.data = dataOrWidth;
      this.width = Math.max(0, toFiniteNumber(width));
      this.height = Math.max(0, toFiniteNumber(height));
      return;
    }
    this.width = Math.max(0, toFiniteNumber(dataOrWidth));
    this.height = Math.max(0, toFiniteNumber(width));
    this.data = new Uint8ClampedArray(this.width * this.height * 4);
  }
}

class PdfJsPath2DShim {
  addPath() {}
  arc() {}
  arcTo() {}
  bezierCurveTo() {}
  closePath() {}
  ellipse() {}
  lineTo() {}
  moveTo() {}
  quadraticCurveTo() {}
  rect() {}
  roundRect() {}
}

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

async function ensurePdfJsNodeGlobals() {
  if (
    globalThis.DOMMatrix &&
    globalThis.ImageData &&
    globalThis.Path2D &&
    globalThis.navigator?.language
  ) {
    return;
  }
  if (!pdfJsGlobalsPromise) {
    pdfJsGlobalsPromise = (async () => {
      const canvasMod = await import("@napi-rs/canvas").catch(() => null);
      if (!globalThis.DOMMatrix) {
        globalThis.DOMMatrix = ((canvasMod as any)?.DOMMatrix || PdfJsDomMatrixShim) as any;
      }
      if (!globalThis.ImageData) {
        globalThis.ImageData = ((canvasMod as any)?.ImageData || PdfJsImageDataShim) as any;
      }
      if (!globalThis.Path2D) {
        globalThis.Path2D = ((canvasMod as any)?.Path2D || PdfJsPath2DShim) as any;
      }
      if (!globalThis.navigator?.language) {
        globalThis.navigator = {
          ...(globalThis.navigator || {}),
          language: "en-US",
          platform: safeString(globalThis.navigator?.platform),
          userAgent: safeString(globalThis.navigator?.userAgent),
        } as Navigator;
      }
    })();
  }
  await pdfJsGlobalsPromise;
}

async function getPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = ensurePdfJsNodeGlobals()
      .then(() => import("pdfjs-dist/legacy/build/pdf.mjs"))
      .catch((error) => {
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
          : null,
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
    const pageCount = Number(doc?.numPages) || 0;
    if (pageIndex < 0 || pageIndex >= pageCount) {
      if (typeof doc.cleanup === "function") doc.cleanup();
      if (typeof doc.destroy === "function") await doc.destroy();
      return null;
    }
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
): Promise<PdfTextExtractionResult> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) return { text: "", pages: [] };

  let doc: any = null;
  try {
    const loadingTask = getServerPdfDocument(pdfjs, pdfBuffer);
    doc = await loadingTask.promise;
    const pages: PdfTextExtractionPage[] = [];
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
