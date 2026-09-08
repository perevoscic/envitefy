"use client";

import { useMemo } from "react";
import { TemplateThumbnailPreview } from "@/components/events/TemplateThumbnail";
import type { PublicTemplate } from "@/lib/public-template-catalog";
import { createSignupTemplateForm } from "@/lib/signup-starters";
import SignupPageRenderer from "./SignupPageRenderer";
import styles from "./signup-theme.module.css";

/** The same editable example in every gallery and design picker. */
export default function SignupTemplatePreview({
  template,
}: {
  template: Pick<PublicTemplate, "id" | "name" | "heroImage">;
}) {
  const { id, name, heroImage } = template;
  const form = useMemo(
    () => createSignupTemplateForm({ id, name, heroImage }),
    [id, name, heroImage],
  );
  return (
    <TemplateThumbnailPreview>
      <SignupPageRenderer form={form} className={styles.thumbnailPage} imageLoading="lazy" />
    </TemplateThumbnailPreview>
  );
}
