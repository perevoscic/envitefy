import type { ReactNode } from "react";
import { getSignupDesign } from "@/lib/signup-designs";
import { resolveSignupThemeStyle } from "@/lib/signup-themes";
import type { SignupForm } from "@/types/signup";
import SignupTemplateHeader from "./SignupTemplateHeader";
import type { SignupHeaderEditing } from "./SignupHeaderDetailsEditor";
import SignupViewer from "./SignupViewer";
import styles from "./signup-theme.module.css";

/** The same page composition for the gallery, editor, review, and public form. */
export default function SignupPageRenderer({
  form,
  children,
  actions,
  ownerActions,
  imageActions,
  className = "",
  imageLoading,
  interactivePreview = false,
  editing,
}: {
  form: SignupForm;
  children?: ReactNode;
  actions?: ReactNode;
  ownerActions?: ReactNode;
  imageActions?: ReactNode;
  className?: string;
  imageLoading?: "eager" | "lazy";
  interactivePreview?: boolean;
  editing?: SignupHeaderEditing;
}) {
  const design = getSignupDesign(form.appearance?.designId);
  const hasHeaderArtwork =
    form.appearance?.headerLayout !== "none" &&
    Boolean(form.header?.backgroundImage || form.header?.images?.length);
  return (
    <div
      className={`${styles.page} ${className}`}
      style={resolveSignupThemeStyle(form)}
      data-signup-theme={form.appearance?.themeId || "legacy"}
      data-signup-design={design?.id}
      data-signup-composition={design?.composition}
    >
      <div className={styles.sheet}>
        {ownerActions && (
          <div
            className={`${styles.ownerActions} ${!hasHeaderArtwork ? styles.ownerActionsAbove : ""}`}
          >
            {ownerActions}
          </div>
        )}
        <SignupTemplateHeader
          form={form}
          actions={actions}
          imageActions={imageActions}
          imageLoading={imageLoading}
          editing={editing}
        />
        {children || (
          <SignupViewer
            eventId="preview"
            initialForm={form}
            viewerKind={interactivePreview ? "guest" : "readonly"}
            interactivePreview={interactivePreview}
          />
        )}
      </div>
    </div>
  );
}
