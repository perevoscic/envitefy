import type { TemplateArtwork } from "./template-artwork";
import TemplateArtworkThumbnailFrame from "./TemplateArtworkThumbnailFrame";
import { getHolidayBackground } from "@/lib/holiday-backgrounds";
import { holidayBackgroundStyle } from "@/lib/holiday-background-style";
import { HolidayBackgroundDecoration } from "./HolidayPageBackground";

export default function HolidayArtworkThumbnail({ design, className }: { design: TemplateArtwork; className?: string }) {
  const background = getHolidayBackground(design.id);
  return <TemplateArtworkThumbnailFrame design={design} className={className} background={background ? { ...background, style: holidayBackgroundStyle(background) } : undefined} decoration={background && <HolidayBackgroundDecoration background={background} compact />} />;
}
