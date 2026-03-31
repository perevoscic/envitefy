import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const QPDF_TIMEOUT_MS = 20_000;
const QPDF_PREFLIGHT_TIMEOUT_MS = 4_000;

let qpdfAvailabilityPromise: Promise<boolean> | null = null;
let qpdfAvailabilityBin: string | null = null;
let qpdfUnavailableLoggedBin: string | null = null;

export type PdfOptimizeResult = {
  buffer: Buffer;
  optimizedByQpdf: boolean;
  warning?: string;
};

function getQpdfBinaryPath(): string {
  return process.env.QPDF_BIN?.trim() || "qpdf";
}

function isMissingQpdfError(error: unknown): boolean {
  const code =
    error && typeof error === "object" && "code" in error ? String((error as any).code || "") : "";
  const message = error instanceof Error ? error.message : String(error || "");
  return code === "ENOENT" || /spawn\s+.+\s+ENOENT/i.test(message);
}

function isPdfOptimizeDebugEnabled(): boolean {
  return (process.env.PDF_OPTIMIZE_DEBUG || "").trim() === "1";
}

function logQpdfUnavailableOnce(qpdfBin: string) {
  if (qpdfUnavailableLoggedBin === qpdfBin) return;
  qpdfUnavailableLoggedBin = qpdfBin;
  if (isPdfOptimizeDebugEnabled()) {
    console.info("[pdf-optimize] qpdf unavailable, using original PDF bytes", {
      qpdfBin,
    });
  }
}

async function isQpdfAvailable(): Promise<boolean> {
  const qpdfBin = getQpdfBinaryPath();
  if (qpdfAvailabilityPromise && qpdfAvailabilityBin === qpdfBin) {
    return qpdfAvailabilityPromise;
  }

  qpdfAvailabilityBin = qpdfBin;
  qpdfAvailabilityPromise = execFileAsync(qpdfBin, ["--version"], {
    timeout: QPDF_PREFLIGHT_TIMEOUT_MS,
    windowsHide: true,
    maxBuffer: 64 * 1024,
  })
    .then(() => true)
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingQpdfError(error)) {
        logQpdfUnavailableOnce(qpdfBin);
        return false;
      }
      console.warn("[pdf-optimize] qpdf-preflight-failed", {
        qpdfBin,
        message,
      });
      return false;
    });

  return qpdfAvailabilityPromise;
}

function buildTempPdfPath(prefix: string): string {
  return path.join(
    os.tmpdir(),
    `envitefy-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.pdf`,
  );
}

async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {}
}

export async function optimizePdfWithQpdf(inputBuffer: Buffer): Promise<PdfOptimizeResult> {
  const qpdfBin = getQpdfBinaryPath();
  if (!(await isQpdfAvailable())) {
    return {
      buffer: inputBuffer,
      optimizedByQpdf: false,
      warning: "qpdf-unavailable",
    };
  }

  const inputPath = buildTempPdfPath("qpdf-in");
  const outputPath = buildTempPdfPath("qpdf-out");

  try {
    await fs.writeFile(inputPath, inputBuffer);

    await execFileAsync(
      qpdfBin,
      [
        "--stream-data=compress",
        "--object-streams=generate",
        "--recompress-flate",
        "--compression-level=9",
        inputPath,
        outputPath,
      ],
      { timeout: QPDF_TIMEOUT_MS, windowsHide: true, maxBuffer: 1024 * 1024 },
    );

    const stats = await fs.stat(outputPath).catch(() => null);
    if (!stats || stats.size <= 0) {
      return {
        buffer: inputBuffer,
        optimizedByQpdf: false,
        warning: "qpdf-produced-empty-output",
      };
    }

    const outputBuffer = await fs.readFile(outputPath);
    if (!outputBuffer.length) {
      return {
        buffer: inputBuffer,
        optimizedByQpdf: false,
        warning: "qpdf-produced-empty-buffer",
      };
    }

    return {
      buffer: outputBuffer,
      optimizedByQpdf: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isMissingQpdfError(error)) {
      logQpdfUnavailableOnce(qpdfBin);
      qpdfAvailabilityPromise = Promise.resolve(false);
      qpdfAvailabilityBin = qpdfBin;
      return {
        buffer: inputBuffer,
        optimizedByQpdf: false,
        warning: "qpdf-unavailable",
      };
    }
    console.warn("[pdf-optimize] qpdf-fallback", {
      qpdfBin,
      message,
    });
    return {
      buffer: inputBuffer,
      optimizedByQpdf: false,
      warning: message,
    };
  } finally {
    await Promise.all([safeUnlink(inputPath), safeUnlink(outputPath)]);
  }
}
