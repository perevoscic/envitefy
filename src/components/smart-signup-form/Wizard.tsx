"use client";

import { useState } from "react";
import EventCanvas from "@/components/EventCanvas";
import { useTemplateEditor } from "@/components/templates/TemplateEditorContext";
import { allowsPublicSignup, signupAccessInstructions } from "@/lib/signup-access";
import {
  addFieldDayStarter,
  COMPOSER_DRAG_TYPE,
  type ComposerDrag,
  placeSignupSection,
  SIGNUP_BLOCKS,
  type SignupBlockId,
} from "@/lib/signup-composer";
import { resolveSignupThemeStyle } from "@/lib/signup-themes";
import {
  type SignupIssue,
  signupPublishWarnings,
  validateSignupPublish,
} from "@/lib/signup-validation";
import type { SignupForm } from "@/types/signup";
import SignupContentEditor from "./SignupContentEditor";
import SignupDesignPanel from "./SignupDesignPanel";
import type { SignupDetailsSection } from "./SignupDetailsEditor";
import SignupImageActions from "./SignupImageActions";
import SignupPageRenderer from "./SignupPageRenderer";
import SignupSettingsEditor from "./SignupSettingsEditor";
import SignupSharing from "./SignupSharing";
import composer from "./signup-composer.module.css";
import styles from "./signup-editor.module.css";

type Props = {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
  submitting?: boolean;
};

export default function SmartSignupWizard({ form, onChange, onSubmit, submitting }: Props) {
  const editor = useTemplateEditor();
  // Legacy design/details/build steps all resume in Build, with their content intact.
  const [activeStep, setActiveStep] = useState("build");
  const review = activeStep === "review";
  const [panel, setPanel] = useState<"add" | "design" | "settings">("add");
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [drag, setDrag] = useState<ComposerDrag | null>(null);
  const [detailsEditor, setDetailsEditor] = useState<SignupDetailsSection | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const publishDisabled = submitting || editor?.hasUnpublishedChanges === false;
  const issues = validateSignupPublish(form);
  const warnings = signupPublishWarnings(form);
  const requiresInvitation =
    Boolean(editor?.signupRequiresInvitation) ||
    !allowsPublicSignup({ status: "published", signupForm: form });
  const focus = (id: string) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: "auto", block: "center" });
        (element?.querySelector<HTMLElement>("input, textarea, button") || element)?.focus({ preventScroll: true });
      }),
    );
  const add = (id: SignupBlockId) => {
    const next = placeSignupSection(form, { kind: "block", id });
    onChange(next);
    setMobileToolsOpen(false);
    focus(`signup-section-${next.sections.at(-1)!.id}`);
  };
  const openLibrary = () => {
    setPanel("add");
    setMobileToolsOpen(true);
    focus("signup-block-library");
  };
  const fixIssue = (issue: SignupIssue) => {
    setActiveStep("build");
    if (issue.step === "details")
      setDetailsEditor(
        issue.field === "signup-location"
          ? "location"
          : issue.field === "signup-title"
            ? null
            : "schedule",
      );
    if (issue.field === "signup-rules") setPanel("settings");
    if (issue.field === "signup-rules") setMobileToolsOpen(true);
    focus(issue.field);
  };
  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (publishDisabled) return;
    if (issues.length) {
      setShowErrors(true);
      return;
    }
    try {
      setSubmitError("");
      await onSubmit(event);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Your form could not be published. Please try again.",
      );
    }
  };
  return (
    <EventCanvas style={resolveSignupThemeStyle(form)}>
      <div className={`${styles.editor} ${composer.composer}`}>
        <div className={composer.topbar}>
          <div>
            <h2>{review ? "Preview & publish" : "Build your signup form"}</h2>
            <p>
              {review
                ? "Try the guest experience before you share it."
                : "Your design is ready. Add your details and the sections you need."}
            </p>
          </div>
          {editor?.duplicateSignup && (
            <button type="button" className={styles.secondary} disabled={submitting} onClick={() => editor.duplicateSignup?.(form)}>
              Duplicate event
            </button>
          )}
        </div>
        {!form.enabled && (
          <div className={styles.notice}>
            <p>Signups are paused for this event.</p>
            <button type="button" className={styles.secondary} onClick={() => onChange({ ...form, enabled: true })}>
              Reopen signups
            </button>
          </div>
        )}
        {review ? (
          <div className={composer.review}>
            {issues.length > 0 && (
              <div className={styles.error} role={showErrors ? "alert" : undefined}>
                <strong>Update these details</strong>
                <ul>
                  {issues.map((issue) => (
                    <li key={issue.message}>
                      <button type="button" onClick={() => fixIssue(issue)}>
                        {issue.message}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {warnings.length > 0 && (
              <div className={styles.notice}>
                <strong>Check your appointment times</strong>
                <ul>
                  {warnings.map((issue) => (
                    <li key={issue.message}>
                      <button type="button" onClick={() => fixIssue(issue)}>
                        {issue.message}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <SignupPageRenderer
              form={form}
              interactivePreview
              requiresInvitation={requiresInvitation}
            />
            <div className={styles.notice}>
              <strong>Who can sign up?</strong>
              <p>
                {!editor?.published &&
                  "Your draft is private until you publish. After publishing: "}
                {signupAccessInstructions(requiresInvitation)}
              </p>
            </div>
          </div>
        ) : (
          <div className={composer.workspace}>
            <div className={composer.canvas}>
              <SignupPageRenderer
                form={form}
                editing={{ onChange, details: detailsEditor, onDetails: setDetailsEditor }}
                imageActions={<SignupImageActions form={form} onChange={onChange} />}
              >
                <SignupContentEditor
                  form={form}
                  onChange={onChange}
                  drag={drag}
                  onDrag={setDrag}
                  onAdd={openLibrary}
                />
              </SignupPageRenderer>
              <div className={composer.sharing}>
                <SignupSharing eventId={editor?.eventId} published={Boolean(editor?.published)} requiresInvitation={requiresInvitation} />
              </div>
            </div>
            <aside
              className={composer.sidebar}
              aria-label="Form tools"
              data-mobile-open={mobileToolsOpen}
            >
              <div className={composer.toolTabs} role="group" aria-label="Editor tools">
                {(["add", "design", "settings"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={panel === id}
                    onClick={() => {
                      setPanel(id);
                      setMobileToolsOpen(panel !== id || !mobileToolsOpen);
                    }}
                  >
                    {id === "add" ? "Add sections" : id === "design" ? "Design" : "Settings"}
                  </button>
                ))}
              </div>
              <div className={composer.toolBody}>
                <button
                  type="button"
                  className={composer.closeTools}
                  onClick={() => setMobileToolsOpen(false)}
                >
                  Done with tools
                </button>
                {panel === "add" && (
                  <div id="signup-block-library" tabIndex={-1} className={composer.library}>
                    <h3>Add to your form</h3>
                    <p>Click to add. On desktop, drag a section into place.</p>
                    <button
                      type="button"
                      className={composer.block}
                      onClick={() => {
                        onChange(addFieldDayStarter(form));
                        setMobileToolsOpen(false);
                        focus("signup-slots");
                      }}
                    >
                      <strong>+ Field Day starter</strong>
                      <span>
                        Add volunteer shifts, supplies, instructions, and a classroom question.
                        Existing sections stay in place.
                      </span>
                    </button>
                    {SIGNUP_BLOCKS.map((block) => (
                      <button
                        key={block.id}
                        type="button"
                        draggable
                        className={composer.block}
                        onClick={() => add(block.id)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(COMPOSER_DRAG_TYPE, block.id);
                          e.dataTransfer.effectAllowed = "copy";
                          setDrag({ kind: "block", id: block.id });
                        }}
                        onDragEnd={() => setDrag(null)}
                      >
                        <strong>+ {block.name}</strong>
                        <span>{block.description}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className={composer.block}
                      onClick={() => focus("signup-questions")}
                    >
                      <strong>Questions for participants</strong>
                      <span>Add short or long answers below your signup sections.</span>
                    </button>
                    <p className={composer.hint}>
                      Every added section can be edited, duplicated, moved, or removed. Name and
                      contact details follow the slot selection.
                    </p>
                  </div>
                )}
                <div hidden={panel !== "design"}>
                  <p className={composer.panelNote}>
                    Create a custom look or fine-tune your selected design.
                  </p>
                  <SignupDesignPanel
                    form={form}
                    onChange={onChange}
                    onUseTheme={() => {
                      setPanel("add");
                      setMobileToolsOpen(false);
                    }}
                  />
                </div>
                {panel === "settings" && <SignupSettingsEditor form={form} onChange={onChange} />}
              </div>
            </aside>
          </div>
        )}
        {submitError && (
          <p role="alert" className={styles.error}>
            {submitError}
          </p>
        )}
        <div className={`${styles.footer} ${composer.footer}`} data-review={review}>
          {review ? (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setActiveStep("build")}
            >
              Back to editing
            </button>
          ) : (
            <span className={`${styles.help} ${composer.footerHelp}`}>Changes stay private until you publish.</span>
          )}
          <div className={composer.footerActions}>
            {editor?.leave && (
              <button type="button" className={`${styles.secondary} ${composer.cancel}`} disabled={submitting} onClick={editor.leave}>
                Cancel
              </button>
            )}
            {!editor && (
              <span className={styles.help}>Use Save draft above to keep your progress.</span>
            )}
            {review ? (
              <button
                type="button"
                className={styles.primary}
                disabled={publishDisabled}
                title={editor?.hasUnpublishedChanges === false ? "Your latest changes are published" : undefined}
                onClick={publish}
              >
                {submitting
                  ? "Publishing…"
                  : editor && !editor.authenticated
                    ? "Save and continue"
                    : "Publish signup"}
              </button>
            ) : (
              <button
                type="button"
                className={styles.primary}
                onClick={() => setActiveStep("review")}
              >
                Preview & publish →
              </button>
            )}
          </div>
        </div>
      </div>
    </EventCanvas>
  );
}
