import type { ReactNode } from "react";
import { getThemedEventDesign } from "@/lib/event-page-themed-designs";
import TemplateArtworkThumbnail from "@/components/events/TemplateArtworkThumbnail";
export default function ThemedOverride({ templateId, fallback }: { templateId: string; fallback: ReactNode }) {
  const design = getThemedEventDesign(templateId);
  return design ? <TemplateArtworkThumbnail design={design} /> : fallback;
}
