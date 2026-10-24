import SignupTemplatePreview from "@/components/smart-signup-form/SignupTemplatePreview";
import type { CategoryThumbnailProps } from "./types";
export default function CategoryThumbnail({ template }: CategoryThumbnailProps) {
  return <SignupTemplatePreview template={template} />;
}
