import { generateInvitationImageWithOpenAi } from "@/lib/studio/openai";
import { encodeScanArtworkWebp } from "./artwork-webp";
import {
  buildScanArtworkPrompt,
  buildScanHeroPrompt,
  type ScanPersonalization,
} from "./personalization";

export type ScanArtworkImages = { background: Buffer; hero?: Buffer };

export class ScanArtworkRenderError extends Error {
  constructor(
    public stage: string,
    public providerStatus?: number,
  ) {
    super("Scan artwork failed");
  }
}

/** Each image can convert as soon as it finishes, without waiting for its partner. */
export async function renderScanArtwork(
  profile: ScanPersonalization,
  variation: string,
  signal = AbortSignal.timeout(120_000),
  includeHero = true,
): Promise<ScanArtworkImages> {
  const render = async (kind: "background" | "hero") => {
    const result = await generateInvitationImageWithOpenAi(
      kind === "hero"
        ? buildScanHeroPrompt(profile, variation)
        : buildScanArtworkPrompt(profile, variation),
      undefined,
      "event_page",
      { signal, ...(kind === "hero" ? { size: "1024x1536" as const } : {}) },
    );
    if (!result.ok) throw new ScanArtworkRenderError(`${kind}-generation`, result.error?.status);
    const base64 = result.imageDataUrl.match(
      /^data:image\/(?:png|jpeg|webp);base64,([\s\S]+)$/,
    )?.[1];
    if (!base64) throw new ScanArtworkRenderError(`${kind}-payload`);
    try {
      return await encodeScanArtworkWebp(Buffer.from(base64, "base64"));
    } catch {
      throw new ScanArtworkRenderError(`${kind}-conversion`);
    }
  };
  // Settle both branches before releasing their memory / the request lifetime.
  const [background, hero] = await Promise.allSettled([
    render("background"),
    includeHero ? render("hero") : Promise.resolve(undefined),
  ]);
  if (background.status === "rejected") throw background.reason;
  if (hero.status === "rejected") throw hero.reason;
  return { background: background.value, hero: hero.value };
}
