"use client";

import { getTemplates } from "@/lib/public-template-catalogs/gymnastics";
import { useSearchParams } from "next/navigation";
import GymnasticsGalleryHeader from "@/components/gym-meet-templates/GymnasticsGalleryHeader";
import PublicTemplateGalleryContents from "../PublicTemplateGalleryContents";
import type { PublicTemplateGalleryProps } from "../PublicTemplateGallery";

export default function CategoryGallery(props: PublicTemplateGalleryProps) {
  const search = useSearchParams();
  const date = search?.get("d");
  const templates = getTemplates();
  return (
    <PublicTemplateGalleryContents
      {...props}
      templates={templates}
      header={!props.featured ? (
        <GymnasticsGalleryHeader
          count={templates.length}
          forwardQueryString={date ? new URLSearchParams({ d: date }).toString() : undefined}
        />
      ) : undefined}
    />
  );
}
