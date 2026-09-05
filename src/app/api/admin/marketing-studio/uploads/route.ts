import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { saveAsset } from "@/lib/admin/marketing-studio/assets";
import { studioErrorResponse } from "@/lib/admin/marketing-studio/http";
import { getConversation, updateConversation } from "@/lib/admin/marketing-studio/repository";
import {
  MAX_STUDIO_REFERENCES,
  MAX_STUDIO_UPLOAD_BYTES,
  requireStudioId,
  StudioRequestError,
  validateStudioUpload,
} from "@/lib/admin/marketing-studio/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const form = await request.formData();
    const rawId = form.get("conversationId");
    if (typeof rawId !== "string") throw new StudioRequestError("A conversation ID is required.");
    const conversationId = requireStudioId(rawId, "conversation ID");
    const conversation = await getConversation(conversationId);
    if (!conversation) throw new StudioRequestError("Conversation not found.", 404);
    const entries = form.getAll("files");
    if (!entries.length || entries.some((entry) => !(entry instanceof File))) {
      throw new StudioRequestError("Choose reference images to upload.");
    }
    const files = entries.filter((entry): entry is File => entry instanceof File);
    if (files.length + conversation.referenceAssetIds.length > MAX_STUDIO_REFERENCES) {
      throw new StudioRequestError(
        `Attach up to ${MAX_STUDIO_REFERENCES} reference images. Remove one before adding more.`,
      );
    }
    for (const file of files) {
      if (!file.size || file.size > MAX_STUDIO_UPLOAD_BYTES) {
        throw new StudioRequestError("Each reference image must be between 1 byte and 25 MB.");
      }
    }
    const prepared = await Promise.all(
      files.map(async (file) => {
        const bytes = Buffer.from(await file.arrayBuffer());
        validateStudioUpload(bytes, file.type);
        try {
          const metadata = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
          if (!metadata.width || !metadata.height) throw new Error("Missing image dimensions");
        } catch {
          throw new StudioRequestError(
            "This image could not be read. Upload a JPG, PNG, or WebP up to 40 megapixels.",
          );
        }
        return { conversationId, versionId: null, name: file.name, mimeType: file.type, bytes };
      }),
    );
    const assets = [];
    // Persist each successful upload in the draft immediately, even if a later upload fails.
    for (const input of prepared) {
      const asset = await saveAsset(input);
      assets.push(asset);
      await updateConversation(conversationId, {
        referenceAssetIds: [...conversation.referenceAssetIds, ...assets.map((item) => item.id)],
      });
    }
    return NextResponse.json({ assets }, { status: 201 });
  } catch (error) {
    return studioErrorResponse(error);
  }
}
