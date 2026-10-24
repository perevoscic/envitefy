import dynamic from "next/dynamic";
import TemplateArtworkThumbnailFrame from "./TemplateArtworkThumbnailFrame";
import type { TemplateArtwork } from "./template-artwork";
import "@/components/birthdays/redesign/birthday-fonts.css";
export type { TemplateArtwork } from "./template-artwork";
export { artworkComposition, artworkInk } from "./template-artwork";

const HolidayArtworkThumbnail = dynamic(() => import("./HolidayArtworkThumbnail"));

/** Only holiday covers need the holiday background catalog and decorations. */
export default function TemplateArtworkThumbnail(props: { design: TemplateArtwork; className?: string }) {
  return props.design.id.startsWith("holidays--")
    ? <HolidayArtworkThumbnail {...props} />
    : <TemplateArtworkThumbnailFrame {...props} />;
}
