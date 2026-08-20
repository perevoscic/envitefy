import sharp from "sharp";
import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { getUserByEmail, updateUserAvatarByEmail } from "@/lib/db";
import { uploadPublicBinaryAsset } from "@/lib/media-upload";
import { validateProfileAvatarMeta } from "@/lib/profile-avatar";

export const runtime = "nodejs";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedRequestUser(req);
    if (!authUser.ok) return errorResponse("Not authenticated", 401);

    const user = await getUserByEmail(authUser.email);
    if (!user) return errorResponse("Not authenticated", 401);

    const formData = await req.formData();
    const file = formData.get("avatar");
    if (!(file instanceof File)) {
      return errorResponse("Choose a profile image to upload.", 400);
    }
    const validation = validateProfileAvatarMeta(file);
    if (!validation.ok) return errorResponse(validation.error, validation.status);

    const source = Buffer.from(await file.arrayBuffer());
    const avatarBytes = await sharp(source)
      .rotate()
      .resize(512, 512, { fit: "cover", position: "attention" })
      .webp({ quality: 88 })
      .toBuffer();
    const uploaded = await uploadPublicBinaryAsset({
      bytes: avatarBytes,
      pathname: `profile-media/${user.id}/avatar-${Date.now()}.webp`,
      contentType: "image/webp",
    });
    const updated = await updateUserAvatarByEmail({
      email: authUser.email,
      avatarUrl: uploaded.url,
    });

    return NextResponse.json(
      { ok: true, avatarUrl: updated.avatar_url || uploaded.url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[profile-avatar] upload failed", error);
    return errorResponse("We could not save that profile image. Please try another image.", 400);
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthenticatedRequestUser(req);
    if (!authUser.ok) return errorResponse("Not authenticated", 401);
    await updateUserAvatarByEmail({ email: authUser.email, avatarUrl: null });
    return NextResponse.json(
      { ok: true, avatarUrl: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[profile-avatar] remove failed", error);
    return errorResponse("We could not remove your profile image.", 400);
  }
}
