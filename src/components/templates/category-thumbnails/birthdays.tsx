import BirthdayDesignPreview from "@/components/birthdays/BirthdayDesignPreview";
import { BIRTHDAY_DESIGN_BY_ID } from "@/data/birthday-design-catalog";
import type { CategoryThumbnailProps } from "./types";
export default function CategoryThumbnail({ template }: CategoryThumbnailProps) {
  const design = BIRTHDAY_DESIGN_BY_ID.get(template.id);
  return design ? <BirthdayDesignPreview design={design} /> : null;
}
