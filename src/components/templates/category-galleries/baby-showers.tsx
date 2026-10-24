"use client";

import { getTemplates } from "@/lib/public-template-catalogs/baby-showers";
import PublicTemplateGalleryContents from "../PublicTemplateGalleryContents";
import type { PublicTemplateGalleryProps } from "../PublicTemplateGallery";

export default function CategoryGallery(props: PublicTemplateGalleryProps) {
  return <PublicTemplateGalleryContents {...props} templates={getTemplates()} />;
}
