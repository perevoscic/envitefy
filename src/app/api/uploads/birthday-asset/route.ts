import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "birthdays");
const MAX_WIDTH = 1600;

async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

type ProcessedImage = {
  buffer: Buffer;
  extension: string;
};

async function processImage(buffer: Buffer, mimeType: string): Promise<ProcessedImage> {
  const normalizedMime = (mimeType || "").toLowerCase();
  const pipeline = sharp(buffer).rotate().resize({
    width: MAX_WIDTH,
    withoutEnlargement: true,
  });

  if (normalizedMime === "image/png") {
    return {
      buffer: await pipeline.png({
        compressionLevel: 8,
        adaptiveFiltering: true,
      }).toBuffer(),
      extension: "png",
    };
  }

  if (normalizedMime === "image/webp") {
    return {
      buffer: await pipeline.webp({
        quality: 80,
      }).toBuffer(),
      extension: "webp",
    };
  }

  return {
    buffer: await pipeline.jpeg({
      quality: 80,
      mozjpeg: true,
    }).toBuffer(),
    extension: "jpg",
  };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { buffer: optimizedBuffer, extension } = await processImage(
      fileBuffer,
      file.type
    );

    await ensureUploadDir();
    const filename = `${randomUUID()}.${extension}`;
    const dest = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(dest, optimizedBuffer);

    console.log(
      "[birthday asset] saved",
      filename,
      optimizedBuffer.length,
      "bytes"
    );

    return NextResponse.json({
      ok: true,
      url: `/uploads/birthdays/${filename}`,
    });
  } catch (err: any) {
    console.error("[birthday asset] upload failed", err);
    return NextResponse.json(
      { error: String(err?.message || "internal error") },
      { status: 500 }
    );
  }
}
