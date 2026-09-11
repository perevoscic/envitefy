"use client";
import EventCanvas from "@/components/EventCanvas";

import React, { useId, useState } from "react";
import { useTemplateEditor, useTemplateState } from "@/components/templates/TemplateEditorContext";
import { getSignupDesign } from "@/lib/signup-designs";
import { applySignupStarter, SIGNUP_STARTERS } from "@/lib/signup-starters";
import { getSignupTheme } from "@/lib/signup-themes";
import { type SignupIssue, validateSignupPublish } from "@/lib/signup-validation";
import type { SignupForm } from "@/types/signup";
import SignupBuilder from "./SignupBuilder";
import SignupDesignPanel from "./SignupDesignPanel";
import SignupDetailsEditor from "./SignupDetailsEditor";
import SignupPageRenderer from "./SignupPageRenderer";
import styles from "./signup-editor.module.css";

type Props = {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
  submitting?: boolean;
};
const STEPS = [
  {
    id: "design",
    name: "Design",
    title: "Make it yours",
    description: "Customize the colors, typography, and photos of your chosen design.",
  },
  {
    id: "details",
    name: "Details",
    title: "Bring people together",
    description: "Add the details your guests need. You can keep the rest simple.",
  },
  {
    id: "build",
    name: "Build signup",
    title: "A place for everyone to help",
    description: "Add what you need, how many, and any useful details.",
  },
  {
    id: "review",
    name: "Review & share",
    title: "Ready for your guests",
    description: "Review the full page and check the details before publishing.",
  },
] as const;
export default function SmartSignupWizard({ form, onChange, onSubmit, submitting }: Props) {
  const editor = useTemplateEditor();
  const formId = useId();
  const [mobilePreview, setMobilePreview] = useState(false);
  // Store a stable step ID so reordering the flow never changes a saved step's meaning.
  // Earlier drafts without this key enter the new flow at Design, keeping their form data.
  const [activeStep, setActiveStep] = useTemplateState<(typeof STEPS)[number]["id"]>(
    "signupWizardStep",
    "design",
  );
  const step = Math.max(
    0,
    STEPS.findIndex((item) => item.id === activeStep),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [pendingStarter, setPendingStarter] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const current = STEPS[step] || STEPS[0];
  const issues = validateSignupPublish(form);
  const go = (next: number) => {
    setActiveStep(STEPS[Math.max(0, Math.min(STEPS.length - 1, next))].id);
    setShowErrors(false);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step !== 3) {
      go(step + 1);
      return;
    }
    if (issues.length) {
      setShowErrors(true);
      return;
    }
    try {
      setSubmitError("");
      await onSubmit(event);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Your form could not be saved. Please try again.",
      );
    }
  };
  const chooseStarter = (id: string) => {
    if (form.sections.some((section) => section.slots.some((slot) => slot.label.trim())))
      setPendingStarter(id);
    else onChange(applySignupStarter(form, id));
  };
  const focusIssue = (field: string, targetStep: SignupIssue["step"]) => {
    setActiveStep(targetStep);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const target = document.getElementById(field);
        if (target instanceof HTMLDetailsElement) {
          target.open = true;
          target.querySelector("summary")?.focus();
        } else target?.focus();
      }),
    );
  };
  return (
    <div className={`${styles.editor} ${step === 0 ? styles.design : ""}`}>
      <ol className={styles.steps} aria-label="Signup creation steps">
        {STEPS.map((item, index) => (
          <li key={item.name}>
            <button
              type="button"
              aria-current={step === index ? "step" : undefined}
              onClick={() => go(index)}
            >
              <span className={styles.stepNumber}>{index + 1}</span>
              {item.name}
            </button>
          </li>
        ))}
      </ol>
      <div className={styles.intro}>
        <div>
          <h2>{current.title}</h2>
          <p>{current.description}</p>
        </div>
        <span className={styles.help}>Step {step + 1} of 4</span>
      </div>
      {step === 0 && (
        <div className={`${styles.segmented} ${styles.mobileToggle}`}>
          <button
            type="button"
            aria-pressed={!mobilePreview}
            onClick={() => setMobilePreview(false)}
          >
            Edit design
          </button>
          <button type="button" aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)}>
            Preview page
          </button>
        </div>
      )}
      <form id={formId} onSubmit={submit}>
        {step === 0 && (
          <div className={`${styles.preview} ${!mobilePreview ? styles.hideMobile : ""}`}>
            <div className={styles.previewLabel}>
              <span>Live page preview</span>
              <span>
                {getSignupDesign(form.appearance?.designId)?.name ||
                  getSignupTheme(form.appearance?.themeId)?.name ||
                  "Your design"}
              </span>
            </div>
            <EventCanvas><SignupPageRenderer form={form} /></EventCanvas>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-5">
            <details className={styles.panel} open={!form.starterId}>
              <summary className="cursor-pointer font-semibold">
                Start with a little structure
              </summary>
              <p className={styles.help}>
                Choose what you are organizing. Your visual theme stays yours.
              </p>
              <div className={styles.starterGrid}>
                {SIGNUP_STARTERS.map((starter) => (
                  <button
                    className={styles.starter}
                    type="button"
                    key={starter.id}
                    aria-pressed={form.starterId === starter.id}
                    onClick={() => chooseStarter(starter.id)}
                  >
                    <strong>{starter.name}</strong>
                    <span>{starter.description}</span>
                  </button>
                ))}
              </div>
              {pendingStarter && (
                <div className={styles.notice} role="status">
                  <p>You already have signup slots. How would you like to use this starter?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => {
                        onChange(applySignupStarter(form, pendingStarter, true));
                        setPendingStarter(null);
                      }}
                    >
                      Add its section
                    </button>
                    {!form.responses.length && (
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => {
                          onChange(applySignupStarter(form, pendingStarter));
                          setPendingStarter(null);
                        }}
                      >
                        Replace current slots
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => setPendingStarter(null)}
                    >
                      Keep my form
                    </button>
                  </div>
                </div>
              )}
            </details>
            <SignupDetailsEditor form={form} onChange={onChange} />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <div id="signup-slots" tabIndex={-1}>
              <SignupBuilder
                form={form}
                onChange={onChange}
                panels={{ basics: false, settings: false, sections: true, questions: true }}
              />
            </div>
            <details className={styles.panel} id="signup-rules">
              <summary className="cursor-pointer font-semibold">
                Signup rules & contact details
              </summary>
              <SignupBuilder
                form={form}
                onChange={onChange}
                panels={{ basics: false, settings: true, sections: false, questions: false }}
              />
            </details>
          </div>
        )}
        {step === 3 && (
          <div className={styles.review}>
            <div className={issues.length ? styles.error : styles.notice}>
              <strong>
                {issues.length
                  ? "A few details need your attention"
                  : "Your signup is ready to publish"}
              </strong>
              {issues.length ? (
                <ul>
                  {issues.map((issue) => (
                    <li key={issue.message}>
                      <button type="button" onClick={() => focusIssue(issue.field, issue.step)}>
                        {issue.message}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  {form.sections.reduce((sum, section) => sum + section.slots.length, 0)} signup
                  slots · {form.questions.length} follow-up questions
                </p>
              )}
            </div>
            <div className={styles.notice}>
              <strong>Who can sign up?</strong>
              <p>
                Invited contacts can sign in and claim slots after accepting your invitation.
                Sharing the page link alone does not grant signup access.
              </p>
              <p className={styles.help}>
                Saving a draft keeps it private. Publishing keeps your existing sharing permissions.
              </p>
            </div>
            <EventCanvas><SignupPageRenderer form={form} /></EventCanvas>
          </div>
        )}
        {showErrors && issues.length > 0 && (
          <div role="alert" className={`${styles.error} mt-4`}>
            Complete the highlighted details before publishing.
          </div>
        )}
        {submitError && (
          <p role="alert" className={styles.error}>
            {submitError}
          </p>
        )}
      </form>
      {step === 0 && (
        <aside
          aria-label="Design customization"
          className={`${styles.designSidebar} ${mobilePreview ? styles.hideMobile : ""}`}
        >
          <SignupDesignPanel form={form} onChange={onChange} />
        </aside>
      )}
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.secondary}
          disabled={step === 0 || submitting}
          onClick={() => go(step - 1)}
        >
          Back
        </button>
        <div className="flex flex-wrap gap-2">
          {editor?.authenticated && (
            <button
              type="button"
              className={styles.secondary}
              disabled={submitting}
              onClick={() => void editor.requestSave()}
            >
              Save draft
            </button>
          )}
          {step < 3 ? (
            <button type="button" className={styles.primary} onClick={() => go(step + 1)}>
              Continue <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button type="submit" form={formId} className={styles.primary} disabled={submitting}>
              {submitting
                ? "Saving…"
                : editor && !editor.authenticated
                  ? "Save and continue"
                  : "Publish signup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
