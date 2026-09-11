import TemplateArtworkThumbnail, {
  artworkComposition,
} from "@/components/events/TemplateArtworkThumbnail";
import type { GymMeetPageTemplateMeta } from "./types";
import "./collection-fonts.css";

export default function GymnasticsThumbnail({ design }: { design: GymMeetPageTemplateMeta }) {
  return (
    <TemplateArtworkThumbnail
      design={{
        id: design.id,
        name: design.name,
        artwork: design.artwork,
        label: "Gymnastics",
        background: design.background,
        ink: design.foreground,
        accent: design.accent,
        font: `"${design.displayFont}", Georgia, serif`,
        composition:
          design.id === "airborne-atlas"
            ? "editorial"
            : artworkComposition(`${design.style} ${design.description}`),
      }}
    />
  );
}
