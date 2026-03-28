import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const QPDF_TIMEOUT_MS = 20_000;

export type PdfOptimizeResult = {
  buffer: Buffer;
  optimizedByQpdf: boolean;
  warning?: string;
};

function getQpdfBinaryPath(): string {
  return process.env.QPDF_BIN?.trim() || "qpdf";
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
  const inputPath = buildTempPdfPath("qpdf-in");
  const outputPath = buildTempPdfPath("qpdf-out");

  try {
    await fs.writeFile(inputPath, inputBuffer);

    await execFileAsync(
      getQpdfBinaryPath(),
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
    console.warn("[pdf-optimize] qpdf-fallback", {
      qpdfBin: getQpdfBinaryPath(),
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
