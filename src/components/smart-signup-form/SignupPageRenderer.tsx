import type { ReactNode } from "react";
import { resolveSignupDesign, resolveSignupThemeStyle, signupContrast } from "@/lib/signup-themes";
import type { SignupForm } from "@/types/signup";
import SignupFormFooter from "./SignupFormFooter";
import type { SignupHeaderEditing } from "./SignupHeaderDetailsEditor";
import SignupTemplateHeader from "./SignupTemplateHeader";
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
  const design = resolveSignupDesign(form.appearance);
  const themeStyle = resolveSignupThemeStyle(form);
  const pageColor = String(themeStyle["--signup-page" as keyof typeof themeStyle] || "#F3F2EE");
  const inverseFooter = signupContrast(pageColor, "#FFFFFF") > signupContrast(pageColor, "#000000");
  const hasHeaderArtwork =
    form.appearance?.headerLayout !== "none" &&
    Boolean(form.header?.backgroundImage || form.header?.images?.length);
  return (
    <div
      className={`${styles.page} ${className}`}
      style={themeStyle}
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
        <SignupFormFooter inverse={inverseFooter} />
      </div>
    </div>
  );
}
