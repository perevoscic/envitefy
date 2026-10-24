"use client";

import dynamic from "next/dynamic";
import { isPotentialThemedTemplateId } from "@/lib/themed-template-id";
import type { CategoryThumbnailProps } from "./category-thumbnails/types";

const weddings = dynamic(() => import("./category-thumbnails/weddings"));
const birthdays = dynamic(() => import("./category-thumbnails/birthdays"));
const baby_showers = dynamic(() => import("./category-thumbnails/baby-showers"));
const gender_reveal = dynamic(() => import("./category-thumbnails/gender-reveal"));
const gymnastics = dynamic(() => import("./category-thumbnails/gymnastics"));
const signup_forms = dynamic(() => import("./category-thumbnails/signup-forms"));
const themed = dynamic(() => import("./category-thumbnails/themed"));

const ThemedOverride = dynamic(() => import("./category-thumbnails/ThemedOverride"));

export default function CategoryTemplateThumbnail(props: CategoryThumbnailProps) {
  const Preview = previews[props.category];
  if (isPotentialThemedTemplateId(props.template.id)) return <ThemedOverride templateId={props.template.id} fallback={<Preview {...props} />} />;
  return <Preview {...props} />;
}

const previews = {
  "weddings": weddings,
  "birthdays": birthdays,
  "anniversaries": birthdays,
  "baby-showers": baby_showers,
  "bridal-showers": themed,
  "gender-reveal": gender_reveal,
  "gymnastics": gymnastics,
  "sport-events": themed,
  "signup-forms": signup_forms,
};
