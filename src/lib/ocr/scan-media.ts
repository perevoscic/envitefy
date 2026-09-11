import { isMedicalAppointmentCategory } from "../medical-appointments.ts";
import { resolveSavedScanPersonalization } from "./personalization.ts";
import { normalizeScanArtwork } from "./scan-artwork-state.ts";

export type ScanSourceKind = "paperwork" | "designed" | "unknown";
export type ScanHeroMode = "generated" | "original";
export type ScanMediaPolicy = {
  sourceKind: ScanSourceKind;
  heroMode: ScanHeroMode;
  medical: boolean;
};
export type ScanOriginalDocument = {
  name: string;
  viewUrl: string;
  displayUrl?: string;
  downloadUrl: string;
  ownerOnly: boolean;
};

export function normalizeScanSourceKind(value: unknown): ScanSourceKind {
  return value === "paperwork" || value === "designed" ? value : "unknown";
}

export function resolveScanMediaPolicy(
  data: Record<string, unknown>,
  title: string,
): ScanMediaPolicy | null {
  const profile = resolveSavedScanPersonalization(data, title);
  const medical =
    Boolean(profile?.medical) || isMedicalAppointmentCategory(String(data.category || ""));
  if (!profile && !medical) return null;
  const fields = data.fieldsGuess;
  const savedSourceKind =
    fields && typeof fields === "object" && "scanSourceKind" in fields
      ? fields.scanSourceKind
      : undefined;
  let sourceKind = normalizeScanSourceKind(data.scanSourceKind);
  if (sourceKind === "unknown") sourceKind = normalizeScanSourceKind(savedSourceKind);
  if (medical) sourceKind = "paperwork";
  if (
    sourceKind === "unknown" &&
    /\b(?:schedule|itinerary|appointment|timetable|confirmation|receipt|business\s+card|contact\s+card)\b/i.test(
      `${title} ${String(data.category || "")}`,
    )
  )
    sourceKind = "paperwork";
  if (sourceKind === "unknown" && /\b(?:flyer|poster|invitation|invite)\b/i.test(title))
    sourceKind = "designed";
  return {
    sourceKind,
    medical,
    // Source type determines the hero. Older scans often lack classification;
    // preserve those originals regardless of a previous manual hero choice.
    heroMode: sourceKind === "paperwork" ? "generated" : "original",
  };
}

export function generatedScanHero(data: Record<string, unknown>): string | null {
  const artwork = normalizeScanArtwork(data.scanArtwork);
  return artwork?.heroImageUrl || (artwork?.status === "ready" ? artwork.imageUrl || null : null);
}

/** Remove medical source media from guest payloads, including nested upload metadata. */
export function withoutMedicalSourceMedia(
  data: Record<string, unknown>,
  title: string,
): Record<string, unknown> {
  if (!resolveScanMediaPolicy(data, title)?.medical) return data;
  const hero = generatedScanHero(data);
  const out = { ...data };
  for (const key of [
    "attachment",
    "thumbnail",
    "thumbnailMeta",
    "heroImage",
    "customHeroImage",
    "coverImageUrl",
    "eventMedia",
    "media",
    "upload",
    "source",
    "sourceContext",
    "sourceEvidence",
    "ocrText",
    "ocrPreview",
    "originalFile",
    "headerImage",
    "image",
    "imageUrl",
    "fieldsGuess",
    "personBirthDate",
    "patientBirthDate",
    "dob",
    "birthDate",
    "birthday",
    "profileImage",
    "headerImageUrl",
  ])
    delete out[key];
  if (Array.isArray(out.ocrFacts))
    out.ocrFacts = out.ocrFacts.filter((fact: unknown) => {
      if (!fact || typeof fact !== "object" || !("label" in fact)) return false;
      return !/^(?:patient)?(?:dob|dateofbirth|birthdate|birthday)$/.test(
        String(fact.label)
          .toLowerCase()
          .replace(/[^a-z]/g, ""),
      );
    });
  out.coverImageUrl = hero;
  out.heroImage = hero;
  if (out.ocrSkin && typeof out.ocrSkin === "object") {
    const skin = { ...out.ocrSkin } as Record<string, unknown>;
    delete skin.background;
    delete skin.imageUrl;
    out.ocrSkin = skin;
  }
  return out;
}
