import type { ReactNode } from "react";
import { getSignupDesign } from "@/lib/signup-designs";
import { resolveSignupThemeStyle } from "@/lib/signup-themes";
import type { SignupForm } from "@/types/signup";
import SignupTemplateHeader from "./SignupTemplateHeader";
import SignupViewer from "./SignupViewer";
import styles from "./signup-theme.module.css";

/** The same page composition for the gallery, editor, review, and public form. */
export default function SignupPageRenderer({
  form,
  children,
  actions,
  imageActions,
  className = "",
  imageLoading,
}: {
  form: SignupForm;
  children?: ReactNode;
  actions?: ReactNode;
  imageActions?: ReactNode;
  className?: string;
  imageLoading?: "eager" | "lazy";
}) {
  const design = getSignupDesign(form.appearance?.designId);
  return (
    <div
      className={`${styles.page} ${className}`}
      style={resolveSignupThemeStyle(form)}
      data-signup-theme={form.appearance?.themeId || "legacy"}
      data-signup-design={design?.id}
      data-signup-composition={design?.composition}
    >
      <div className={styles.sheet}>
        <SignupTemplateHeader
          form={form}
          actions={actions}
          imageActions={imageActions}
          imageLoading={imageLoading}
        />
        {children || <SignupViewer eventId="preview" initialForm={form} viewerKind="readonly" />}
      </div>
    </div>
  );
}
