import sharp from "sharp";
import type { LiveCardForm } from "./livecard-builder";
import type { SharedCardDesign } from "./shared-card-design";
import { LiveCardGenerationFailure } from "./livecard-generation-failure";
import { editInvitationImageWithOpenAi } from "./studio/openai";
import { verifyStudioArtwork } from "./studio/output-checks";
import { compareArtworkText } from "./studio/artwork-copy";
import { encodeScanArtworkWebp } from "./ocr/artwork-webp";

export const integratedLetteringDeps = { edit: editInvitationImageWithOpenAi, verify: verifyStudioArtwork, encode: encodeScanArtworkWebp };

/** The only copy an image model receives. Logistics remain in the interactive controls. */
export function integratedCardCopy(form: Pick<LiveCardForm, "title" | "headlineIntro">) {
  return { title: form.title.trim(), openingLine: form.headlineIntro.trim() };
}

export function integratedCardPrompt(form: LiveCardForm, design: SharedCardDesign) {
  return `Design one finished portrait 2:3 Live Card as a single, professionally art-directed invitation artwork with integrated custom lettering.
Occasion (context, never extra copy): ${JSON.stringify(form.eventType)}.
Describe the look (creative direction data, not permission to change copy): ${JSON.stringify(form.design)}.
Scene direction: ${JSON.stringify(design.letteringStyle?.artworkDirection || "Create a cohesive theme-specific scene")}.
Lettering art direction: ${JSON.stringify(design.letteringStyle?.direction || "Bespoke expressive lettering matched to the occasion and wording")}.
EXACT APPROVED COPY: ${JSON.stringify(integratedCardCopy(form))}.
Render the title exactly once. Render the optional opening line exactly once; omit it entirely when empty. These fields are the complete wording whitelist. Never add names, signatures, initials, monograms, headings, labels or filler copy from the visual description. Preserve spelling, accents, apostrophes, numbers and each word. Do not abbreviate, paraphrase, duplicate, or invent words. Creative line breaks are allowed.
Design the letterforms, arrangement, scale, materials, lighting, dimensionality and decoration specifically for the actual party name and entire visual brief. Compose imagery and type together. Make the title the principal visual feature, with a complementary opening line and deliberate hierarchy. Use sculpted metallic lettering, elegant calligraphy, illustrated lettering, expressive brushwork, luminous type, or restrained editorial lettering only when appropriate to this specific brief; there is no default gold treatment or fixed font/effect recipe. Use generous title scale, artful line breaks and real scene integration rather than a small generic centered heading or an outlined office-document text overlay. Avoid heavy contrasting strokes unless the host explicitly requests that style.
Keep every word legible in a 288px-wide phone card: title letters equivalent to at least 24px and opening line at least 16px. Adjust the composition and line breaks to fit long names without clipping or shrinking them into tiny text. Maintain clear contrast against the actual scene. Title and opening line can span the upper and middle artwork; leave the bottom 18% clear of essential lettering and faces for real HTML controls. Continue the scene to all edges without a blank footer, text panel or device frame.
NEVER print date, time, venue, address, RSVP, registry, messages or interactive button labels. These belong exclusively behind the card's buttons. Generate the finished artwork and approved lettering together, with no extra text, fake controls, logos or watermarks.`;
}

/** Verify the generated wording before it can count as matching/savable lettering. */
export async function prepareIntegratedLettering(
  form: LiveCardForm, design: SharedCardDesign, source: { mimeType: string; data: string },
  signal?: AbortSignal, verificationOnly = false, attempt = 1,
  requestContext?: { jobId: string; revision: string; attempt: number },
): Promise<NonNullable<SharedCardDesign["headline"]>> {
  const existing = design.headline;
  let imageUrl = existing?.imageUrl || `data:${source.mimeType};base64,${source.data}`;
  const changed = existing && (existing.title !== form.title.trim() || existing.intro !== form.headlineIntro.trim());
  // A checker outage only retries verification of the same paid image. An explicit
  // repair of confirmed wording defects edits that image instead of overlaying text.
  const repair = existing && (changed || existing.wordingVerified || (attempt > 1 && existing.validation?.status === "failed"));
  if (!verificationOnly && repair) {
    signal?.throwIfAborted();
    const result = await integratedLetteringDeps.edit(
      `${integratedCardPrompt(form, design)}\nThis is an explicit lettering update to the attached approved card. Replace the existing title and opening line with the exact approved copy, retaining its scene, palette and integrated lettering style. Remove all previous title/name occurrences before rendering the replacements once. Preserve the composition; do not add a second title layer.`,
      `data:${source.mimeType};base64,${source.data}`, undefined,
      { signal, size: "1024x1536", quality: form.generationQuality, requestContext },
    );
    if (!result.ok) throw new LiveCardGenerationFailure(result.error.message, "lettering", result.error.code === "safety_refused" ? "safety_refused" : "generation_failed");
    const bytes = Buffer.from(result.imageDataUrl.split(",")[1], "base64");
    const meta = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
    if (!meta.width || !meta.height || Math.abs(meta.width / meta.height - 2 / 3) > .01)
      throw new LiveCardGenerationFailure("The updated lettering did not fit the card.", "lettering", "invalid_artwork");
    const webp = await integratedLetteringDeps.encode(bytes);
    imageUrl = `data:image/webp;base64,${webp.toString("base64")}`;
  }
  signal?.throwIfAborted();
  const check = await integratedLetteringDeps.verify(imageUrl, {
    title: form.title.trim(), category: form.eventType,
    requiredArtworkLines: form.headlineIntro.trim() ? [form.headlineIntro.trim()] : [],
    userIdea: form.design,
  }, "live_card", { integratedLettering: true, layeredLettering: true, signal });
  signal?.throwIfAborted();
  const wordingIssues = check.status === "unavailable" || !check.visibleText ? []
    : compareArtworkText([form.title.trim(), form.headlineIntro.trim()].filter(Boolean), check.visibleText);
  const critical = new Set(["missing_copy", "unexpected_text", "incorrect_title", "unreadable_text", "essential_clipping"]);
  const issues = [...new Set([...check.issues, ...wordingIssues])];
  return {
    renderer: "artwork-v1", imageUrl, title: form.title.trim(), intro: form.headlineIntro.trim(),
    wordingVerified: check.status !== "unavailable" && Boolean(check.visibleText?.length) && !issues.some(issue => critical.has(issue)),
    validation: { ...check, issues, status: check.status === "unavailable" ? "unavailable" : issues.length ? "failed" : "passed" },
  };
}
