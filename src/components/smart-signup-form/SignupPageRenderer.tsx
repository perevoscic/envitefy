import type { ReactNode } from "react";
import type { SignupForm } from "@/types/signup";
import { resolveSignupThemeStyle } from "@/lib/signup-themes";
import SignupTemplateHeader from "./SignupTemplateHeader";
import SignupViewer from "./SignupViewer";
import styles from "./signup-theme.module.css";

/** The same page composition for the gallery, editor, review, and public form. */
export default function SignupPageRenderer({ form, children, actions, className = "" }: {
  form: SignupForm; children?: ReactNode; actions?: ReactNode; className?: string;
}) {
  return <div className={`${styles.page} ${className}`} style={resolveSignupThemeStyle(form)} data-signup-theme={form.appearance?.themeId || "legacy"}>
    <div className={styles.sheet}>
      <SignupTemplateHeader form={form} actions={actions} />
      {children || <SignupViewer eventId="preview" initialForm={form} viewerKind="readonly" />}
    </div>
  </div>;
}
