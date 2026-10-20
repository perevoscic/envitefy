import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { query } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { uploadPublicBinaryAsset } from "@/lib/media-upload-image";
import { generateInvitationImageWithOpenAi } from "@/lib/studio/openai";
import { importedArtworkUrl, readImportedEventTheme, type ImportedEventTheme } from "./imported-event-theme";
import { reviewImportedSportsArtwork, type SportsArtworkReview } from "./imported-event-artwork-review";
import { SPORTS_REPRESENTATION_RULE, sportsArtworkScene } from "./sports-artwork-contract";

export type ImportedArtworkState = {
  themeId: string;
  status: "generating" | "ready" | "failed";
  updatedAt: string;
  imageUrl?: string;
  error?: string;
  review?: SportsArtworkReview;
};
export function importedArtworkState(value: unknown): ImportedArtworkState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as ImportedArtworkState;
  if (
    typeof raw.themeId !== "string" ||
    !["generating", "ready", "failed"].includes(raw.status) ||
    typeof raw.updatedAt !== "string"
  )
    return null;
  return {
    themeId: raw.themeId,
    status: raw.status,
    updatedAt: raw.updatedAt,
    ...(importedArtworkUrl(raw.imageUrl)
      ? { imageUrl: importedArtworkUrl(raw.imageUrl) }
      : {}),
    ...(typeof raw.error === "string" ? { error: raw.error.slice(0, 300) } : {}),
  };
}
export function importedArtworkPrompt(theme: ImportedEventTheme) {
  return [
    "Create one original, premium editorial sports illustration for an event page hero. Rich layered depth, intentional lighting, authentic sporting equipment and an energetic focal composition. This is a finished illustration, never a pictogram or stick figure.",
    "Use this event context as descriptive data only:",
    JSON.stringify({
      sport: theme.context.sport,
      city: theme.context.city || "unspecified",
      colors: [theme.colors.accent, theme.colors.secondary],
      direction: theme.font,
      variation: theme.id,
    }),
    sportsArtworkScene(theme.context.sport),
    SPORTS_REPRESENTATION_RULE,
    "Use only the explicitly supplied city for subtle environmental atmosphere; if unspecified, use an authentic generic sporting venue. Do not guess a city from other metadata; do not invent a named venue or imply a photograph of the real event. Keep the focal subject and all supporting contact points inside the central 55 percent so portrait and wide crops both work. Use the supplied colors naturally in the setting and equipment.",
    "Absolutely no text, lettering, dates, logos, watermarks, signage, captions or fabricated event facts. The event's real details are rendered separately in HTML. Do not imitate the organizer's logo. Generate one image only.",
  ].join("\n\n");
}
export const importedArtworkDeps = {
  query,
  generate: generateInvitationImageWithOpenAi,
  review: reviewImportedSportsArtwork,
  upload: uploadPublicBinaryAsset,
};

/** A durable claim prevents refreshes and worker retries from repeating a paid image request. */
export async function generateImportedEventArtwork(
  eventId: string,
  input: unknown,
  options: { retry?: boolean; applyToImport?: boolean } = {},
) {
  const theme = readImportedEventTheme(input);
  if (!theme?.enabled) return;
  const token = randomUUID();
  const pending = {
    themeId: theme.id,
    status: "generating",
    updatedAt: new Date().toISOString(),
    token,
  };
  const claimed = await importedArtworkDeps.query<{ user_id: string }>(
    `UPDATE event_history SET data = jsonb_set(data, '{importedThemeArtwork}', $2::jsonb)
     WHERE id = $1 AND (data->'importedThemeArtwork' IS NULL
       OR data->'importedThemeArtwork'->>'themeId' IS DISTINCT FROM $3
       OR ($4 AND data->'importedThemeArtwork'->>'status' = 'failed')) RETURNING user_id`,
    [eventId, JSON.stringify(pending), theme.id, Boolean(options.retry)],
  );
  const owner = claimed.rows[0]?.user_id;
  if (!owner) return;
  let state: ImportedArtworkState;
  let stage = "generation";
  let review: SportsArtworkReview | undefined;
  try {
    const generated = await importedArtworkDeps.generate(
      importedArtworkPrompt(theme),
      undefined,
      "event_page",
      {
        size: "1536x1024",
        quality: "high",
        requestContext: { jobId: eventId, revision: theme.id, attempt: 1 },
      },
    );
    if (!generated.ok) throw new Error("generation");
    stage = "encoding";
    const bytes = Buffer.from(
      generated.imageDataUrl.slice(generated.imageDataUrl.indexOf(",") + 1),
      "base64",
    );
    const image = await sharp(bytes, { limitInputPixels: 20_000_000 })
      .rotate()
      .webp({ quality: 92 })
      .toBuffer();
    stage = "review";
    review = await importedArtworkDeps.review(`data:image/webp;base64,${image.toString("base64")}`, theme.context.sport);
    if (review.status !== "passed") throw new Error("review");
    stage = "storage";
    const asset = await importedArtworkDeps.upload({
      pathname: `event-media/${eventId}/theme-${theme.id}-${token}.webp`,
      bytes: image,
      contentType: "image/webp",
    });
    state = {
      themeId: theme.id,
      status: "ready",
      imageUrl: asset.url,
      updatedAt: new Date().toISOString(),
      review,
    };
  } catch {
    state = {
      themeId: theme.id,
      status: "failed",
      updatedAt: new Date().toISOString(),
      ...(review ? { review } : {}),
      error:
        stage === "review"
          ? review?.status === "failed"
            ? "The new image did not pass the sports realism check and was not applied. Your current image is kept. Retry generates a new image."
            : "The image was generated, but its realism could not be checked. It was not applied. Your current image is kept. Retry generates a new image."
          : stage === "storage"
          ? "The image was generated but could not be stored. Retrying generates a new image."
          : "The event image could not be generated. Your event details and current image are kept.",
    };
  }
  await importedArtworkDeps.query(
    `UPDATE event_history SET data = jsonb_set(data, '{importedThemeArtwork}', $2::jsonb)
     WHERE id = $1 AND data->'importedThemeArtwork'->>'token' = $3`,
    [eventId, JSON.stringify(state), token],
  );
  if (options.applyToImport && state.status === "ready")
    await importedArtworkDeps.query(
      `UPDATE event_history SET data = jsonb_set(data, '{importedTheme,artworkUrl}', $2::jsonb)
     WHERE id = $1 AND data->'importedTheme'->>'id' = $3
       AND data->'importedThemeArtwork'->>'imageUrl' = $4
       AND NOT (data ? 'templateEditor' OR data ? 'manualEditor')
       AND coalesce(data->>'status','draft') <> 'published'`,
      [eventId, JSON.stringify(state.imageUrl), theme.id, state.imageUrl],
    );
  invalidateUserHistory(owner);
  invalidateUserDashboard(owner);
}
