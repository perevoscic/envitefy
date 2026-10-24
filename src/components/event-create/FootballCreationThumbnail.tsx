import FootballThumbnail from "@/components/football-season-templates/FootballThumbnail";
import { FOOTBALL_GALLERY_DESIGNS } from "@/components/football-season-templates/footballGallery";
export default function FootballCreationThumbnail({ templateId }: { templateId: string }) {
  const design = FOOTBALL_GALLERY_DESIGNS.find(item => item.id === templateId);
  return design ? <FootballThumbnail design={design} /> : null;
}
