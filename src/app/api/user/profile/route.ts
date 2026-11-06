import { randomUUID } from "node:crypto";
import { del } from "@vercel/blob";
import { getGoogleCalendarRefreshToken } from "@/lib/google-calendar-connection";
import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import {
  getMicrosoftRefreshToken,
  getUserByEmail,
  updatePreferredProviderByEmail,
  updateUserNamesByEmail,
  updateUserProfileByEmail,
} from "@/lib/db";
import { uploadPrivateBinaryAsset } from "@/lib/media-upload-image";
import { renderProfileAvatarWebp } from "@/lib/profile-avatar-image";
import { validateProfileAvatarMeta } from "@/lib/profile-avatar";

export const runtime = "nodejs";

async function saveProfileForm(req: Request, email: string) {
  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const form = await req.formData();
  const firstName = form.get("firstName");
  const lastName = form.get("lastName");
  const avatarAction = form.get("avatarAction") || "keep";
  const file = form.get("avatar");
  if (
    (firstName !== null && typeof firstName !== "string") ||
    (lastName !== null && typeof lastName !== "string") ||
    !["keep", "replace", "remove"].includes(String(avatarAction)) ||
    (avatarAction !== "replace" && file !== null)
  ) {
    return NextResponse.json({ error: "Invalid profile changes." }, { status: 400 });
  }
  if (avatarAction === "replace") {
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a profile image to upload." }, { status: 400 });
    }
    const validation = validateProfileAvatarMeta(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
  }

  let uploaded: Awaited<ReturnType<typeof uploadPrivateBinaryAsset>> | undefined;
  try {
    const changes: Parameters<typeof updateUserProfileByEmail>[0] = { email };
    if (typeof firstName === "string") changes.firstName = firstName || null;
    if (typeof lastName === "string") changes.lastName = lastName || null;
    if (avatarAction === "replace" && file instanceof File) {
      const source = Buffer.from(await file.arrayBuffer());
      const bytes = await renderProfileAvatarWebp(source);
      uploaded = await uploadPrivateBinaryAsset({
        bytes,
        pathname: `profile-media/${user.id}/avatar-${Date.now()}-${randomUUID()}.webp`,
        contentType: "image/webp",
      });
      changes.avatarUrl = uploaded.url;
    } else if (avatarAction === "remove") {
      changes.avatarUrl = null;
    }
    const updatedUser = await updateUserProfileByEmail(changes);
    return NextResponse.json({
      ok: true,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      avatarUrl: updatedUser.avatar_url || null,
      preferredProvider: updatedUser.preferred_provider || null,
      primarySignupSource: updatedUser.primary_signup_source || "legacy",
      productScopes: Array.isArray(updatedUser.product_scopes) ? updatedUser.product_scopes : ["snap"],
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (uploaded) {
      try {
        // A connection can fail after the UPDATE commits. Only remove an asset
        // after a fresh read confirms that the account does not reference it.
        const currentUser = await getUserByEmail(email);
        if (currentUser?.avatar_url !== uploaded.url) {
          await del(uploaded.rawBlobUrl || uploaded.pathname);
        }
      } catch (cleanupError) {
        console.error("[profile] failed to remove unsaved avatar", cleanupError);
      }
    }
    console.error("[profile] save failed", error);
    return NextResponse.json(
      { error: "We could not save your profile. Please try again." },
      { status: 400 },
    );
  }
}

export async function GET(req: Request) {
  const authUser = await getAuthenticatedRequestUser(req);
  if (!authUser.ok) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { email, session } = authUser;
  const user = await getUserByEmail(email);
  return NextResponse.json({
    email: user?.email || email,
    firstName: user?.first_name || null,
    lastName: user?.last_name || null,
    avatarUrl: user?.avatar_url || null,
    preferredProvider: user?.preferred_provider || null,
    name: session.user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || null,
    isAdmin: Boolean(user?.is_admin),
    primarySignupSource: user?.primary_signup_source || "legacy",
    productScopes: Array.isArray(user?.product_scopes) ? user.product_scopes : ["snap"],
  });
}

export async function PUT(req: Request) {
  try {
    const authUser = await getAuthenticatedRequestUser(req);
    if (!authUser.ok) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { email } = authUser;

    if (req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
      return await saveProfileForm(req, email);
    }

    const body = await req.json().catch(() => ({} as any));
    // Only include keys that were actually present in the request body.
    const hasFirst = Object.hasOwn(body, "firstName");
    const hasLast = Object.hasOwn(body, "lastName");
    const firstName = hasFirst
      ? body.firstName === ""
        ? null
        : String(body.firstName)
      : undefined;
    const lastName = hasLast
      ? body.lastName === ""
        ? null
        : String(body.lastName)
      : undefined;
    const rawPref =
      body.preferredProvider == null || body.preferredProvider === ""
        ? null
        : String(body.preferredProvider).toLowerCase();
    const preferredProvider: "google" | "microsoft" | "apple" | null =
      rawPref === "google" || rawPref === "microsoft" || rawPref === "apple"
        ? (rawPref as "google" | "microsoft" | "apple")
        : null;
    const hasPreferredProvider = Object.hasOwn(
      body,
      "preferredProvider"
    );
    let updatedUser = await getUserByEmail(email);
    if (!updatedUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (hasPreferredProvider && preferredProvider) {
      if (preferredProvider === "apple") {
        return NextResponse.json(
          {
            error:
              "Apple Calendar is available from each event, but is not connected as a default calendar.",
          },
          { status: 400 },
        );
      }
      const providerConnected =
        preferredProvider === "google"
          ? Boolean(await getGoogleCalendarRefreshToken(email))
          : Boolean(await getMicrosoftRefreshToken(email));
      if (!providerConnected) {
        return NextResponse.json(
          { error: "Connect this calendar before setting it as your default." },
          { status: 400 },
        );
      }
    }

    if (hasFirst || hasLast) {
      const namePayload: any = { email };
      if (hasFirst) namePayload.firstName = firstName;
      if (hasLast) namePayload.lastName = lastName;
      updatedUser = await updateUserNamesByEmail(namePayload);
    }

    if (
      hasPreferredProvider &&
      preferredProvider !== (updatedUser.preferred_provider || null)
    ) {
      updatedUser = await updatePreferredProviderByEmail({ email, preferredProvider });
    }

    return NextResponse.json({
      ok: true,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      avatarUrl: updatedUser.avatar_url || null,
      preferredProvider: updatedUser.preferred_provider || null,
      primarySignupSource: updatedUser.primary_signup_source || "legacy",
      productScopes: Array.isArray(updatedUser.product_scopes)
        ? updatedUser.product_scopes
        : ["snap"],
    });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
