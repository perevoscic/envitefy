import GymnasticsThumbnail from "@/components/gym-meet-templates/GymnasticsThumbnail";
import { GYM_MEET_TEMPLATE_LIBRARY } from "@/components/gym-meet-templates/registry";
import type { CategoryThumbnailProps } from "./types";
export default function CategoryThumbnail({ template }: CategoryThumbnailProps) {
  const design = GYM_MEET_TEMPLATE_LIBRARY.find((item) => item.id === template.id);
  return design ? <GymnasticsThumbnail design={design} /> : null;
}
