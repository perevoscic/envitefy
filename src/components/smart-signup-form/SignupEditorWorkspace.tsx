"use client";

import {
  ClipboardList,
  Link2,
  ListPlus,
  Palette,
  PanelsTopLeft,
  Pencil,
  Share2,
  Type,
} from "lucide-react";
import { useState } from "react";
import {
  EventEditorInput,
  EventEditorMenuCard,
  EventEditorSection,
  EventEditorToolsRow,
} from "@/components/events/EventEditorFields";
import EventEditorWorkspace from "@/components/events/EventEditorWorkspace";
import { useEventPageReadOnly } from "@/components/events/EventPageReadOnlyContext";
import { EventUrlEditor } from "@/components/events/EventUrlEditor";
import type { EventPageEditorSession } from "@/components/events/useEventPageEditor";
import type { TemplateEditorRuntime } from "@/components/templates/TemplateEditorContext";
import {
  addFieldDayStarter,
  type ComposerDrag,
  placeSignupSection,
  SIGNUP_BLOCKS,
  type SignupBlockId,
} from "@/lib/signup-composer";
import { resolveSignupThemeStyle } from "@/lib/signup-themes";
import { signupPublishWarnings, validateSignupPublish } from "@/lib/signup-validation";
import type { SignupForm } from "@/types/signup";
import SignupContentEditor from "./SignupContentEditor";
import SignupDesignPanel from "./SignupDesignPanel";
import SignupDetailsEditor, { type SignupDetailsSection } from "./SignupDetailsEditor";
import SignupImageActions from "./SignupImageActions";
import SignupPageRenderer from "./SignupPageRenderer";
import SignupSettingsEditor from "./SignupSettingsEditor";
import SignupSharing from "./SignupSharing";
import styles from "./signup-native-workspace.module.css";

type Panel =
  | "main"
  | "sections"
  | "layout"
  | "url"
  | "headline"
  | "design"
  | "background"
  | "details"
  | "signups"
  | "sharing";
const titles: Record<Panel, string> = {
  main: "Add your details",
  sections: "Page sections",
  layout: "Layout",
  url: "Custom URL",
  headline: "Headline",
  design: "Design",
  background: "Background",
  details: "Details",
  signups: "Sign-ups",
  sharing: "Sharing",
};

function SignupWorkspacePreview({
  form,
  onChange,
  details,
  onDetails,
  requiresInvitation,
}: {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
  details: SignupDetailsSection | null;
  onDetails: (details: SignupDetailsSection | null) => void;
  requiresInvitation: boolean;
}) {
  const readOnly = useEventPageReadOnly();
  return (
    <SignupPageRenderer
      form={form}
      requiresInvitation={requiresInvitation}
      interactivePreview={readOnly}
      editing={readOnly ? undefined : { onChange, details, onDetails }}
      imageActions={readOnly ? undefined : <SignupImageActions form={form} onChange={onChange} />}
    ></SignupPageRenderer>
  );
}

/** Sign-up content uses the same workspace, menu cards and actions as Event Pages. */
export default function SignupEditorWorkspace({
  form,
  onChange,
  onPublish,
  submitting,
  editor,
  requiresInvitation,
}: {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
  onPublish: () => Promise<void>;
  submitting?: boolean;
  editor: TemplateEditorRuntime;
  requiresInvitation: boolean;
}) {
  const [panel, setPanel] = useState<Panel>("main");
  const [drag, setDrag] = useState<ComposerDrag | null>(null);
  const [details, setDetails] = useState<SignupDetailsSection | null>(null);
  const [error, setError] = useState("");
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [urlBusy, setUrlBusy] = useState(false);
  const [reveal, setReveal] = useState(0);
  const issues = validateSignupPublish(form);
  const warnings = signupPublishWarnings(form);
  const open = (next: Panel) => {
    setPanel(next);
    setReveal((value) => value + 1);
  };
  const add = (id: SignupBlockId) => onChange(placeSignupSection(form, { kind: "block", id }));
  const publish = async () => {
    if (issues.length) {
      setValidationAttempted(true);
      return;
    }
    try {
      setError("");
      await onPublish();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your form could not be published. Please try again.",
      );
    }
  };
  const session: EventPageEditorSession = {
    eventId: editor.eventId,
    published: Boolean(editor.published),
    dirty: editor.hasUnpublishedChanges !== false,
    busy: Boolean(submitting || editor.busy || urlBusy),
    ready: editor.ready,
    authenticated: editor.authenticated,
    error:
      validationAttempted && issues.length ? issues.map((issue) => issue.message).join(" ") : error,
    message: "",
    saveDraft: async () => {
      try {
        await editor.requestSave();
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Your draft could not be saved.");
      }
    },
    saveChanges: publish,
    cancel: () => editor.leave?.(),
    allowNavigation: (navigate) => navigate(),
    requestLeave: (navigate) => navigate(),
  };
  const menus = [
    { id: "headline", title: "Headline", desc: "Title, date, location.", icon: <Type size={18} /> },
    {
      id: "design",
      title: "Design",
      desc: "Artwork, page style, and typography.",
      icon: <Type size={18} />,
    },
    {
      id: "background",
      title: "Background",
      desc: "Coordinated backgrounds and colors.",
      icon: <Palette size={18} />,
    },
    {
      id: "details",
      title: "Details",
      desc: "Description, arrival, and planning details.",
      icon: <Pencil size={18} />,
    },
    {
      id: "signups",
      title: "Sign-ups",
      desc: "Contact fields, capacity, and signup rules.",
      icon: <ClipboardList size={18} />,
    },
    {
      id: "sharing",
      title: "Sharing",
      desc: "Guest access and planning together.",
      icon: <Share2 size={18} />,
    },
  ] as const;
  return (
    <div className={styles.root} style={resolveSignupThemeStyle(form)}>
      <EventEditorWorkspace
        editor={session}
        customUrlMenu={false}
        compositionMenu="inline"
        revealControls={reveal ? `signup-${reveal}` : undefined}
        onBackWithinControls={() => {
          if (panel === "main") return false;
          setPanel("main");
          return true;
        }}
        preview={
          <SignupWorkspacePreview
            form={form}
            onChange={onChange}
            details={details}
            onDetails={setDetails}
            requiresInvitation={requiresInvitation}
          />
        }
        controls={
          <>
            <EventEditorToolsRow>
              <EventEditorMenuCard
                compact
                title="Page sections"
                desc="Add, edit and move sections on your page."
                icon={<ListPlus size={20} />}
                active={panel === "sections"}
                onClick={() => open("sections")}
              />
              <EventEditorMenuCard
                compact
                title="Layout"
                desc="Arrange your hero image and title."
                icon={<PanelsTopLeft size={20} />}
                active={panel === "layout"}
                onClick={() => open("layout")}
              />
              <EventEditorMenuCard
                compact
                title="Custom URL"
                desc="Choose your shareable web address."
                icon={<Link2 size={20} />}
                active={panel === "url"}
                onClick={() => open("url")}
              />
            </EventEditorToolsRow>
            {panel === "main" ? (
              <div className={styles.menu}>
                <div>
                  <button className={styles.back} type="button" onClick={editor.leave}>
                    ← All sign-up designs
                  </button>
                  <h2>Add your details</h2>
                  <p>Customize every aspect of your sign-up page.</p>
                </div>
                {menus.map((item) => (
                  <EventEditorMenuCard
                    key={item.id}
                    title={item.title}
                    desc={item.desc}
                    icon={item.icon}
                    onClick={() => open(item.id)}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.panel}>
                <EventEditorSection title={titles[panel]} onBack={() => setPanel("main")}>
                  {panel === "headline" && (
                    <SignupDetailsEditor idPrefix="signup-panel" form={form} onChange={onChange} />
                  )}
                  {panel === "details" && (
                    <>
                      <EventEditorInput
                        label="Description"
                        value={form.description}
                        type="textarea"
                        onChange={(description) => onChange({ ...form, description })}
                      />
                      <SignupDetailsEditor
                        idPrefix="signup-panel"
                        form={form}
                        onChange={onChange}
                        section="planning"
                      />
                    </>
                  )}
                  {(["design", "background", "layout"] as const).map(
                    (mode) =>
                      panel === mode && (
                        <SignupDesignPanel
                          key={mode}
                          mode={mode}
                          form={form}
                          onChange={onChange}
                          eventId={editor.eventId}
                          onUseTheme={() => setPanel("main")}
                        />
                      ),
                  )}
                  {panel === "signups" && <SignupSettingsEditor form={form} onChange={onChange} />}
                  {panel === "url" && (
                    <EventUrlEditor
                      eventId={editor.eventId}
                      historyClient={editor.historyClient}
                      onUpdated={editor.publicUrlUpdated}
                      onBusyChange={setUrlBusy}
                      disabled={session.busy}
                    />
                  )}
                  {panel === "sharing" && (
                    <>
                      <SignupSharing
                        eventId={editor.eventId}
                        eventTitle={form.title}
                        published={Boolean(editor.published)}
                        requiresInvitation={requiresInvitation}
                        canManageCollaborators={editor.canManageCollaborators}
                      />
                      {editor.duplicateSignup && (
                        <button
                          className={styles.secondary}
                          type="button"
                          disabled={session.busy}
                          onClick={() => editor.duplicateSignup?.(form)}
                        >
                          Duplicate event
                        </button>
                      )}
                      <button
                        className={styles.secondary}
                        type="button"
                        disabled={session.busy}
                        onClick={editor.startOver}
                      >
                        Start over
                      </button>
                    </>
                  )}
                  {panel === "sections" && (
                    <div className={styles.sections}>
                      <p>Add, edit and move sections on your page.</p>
                      <button
                        className={styles.secondary}
                        type="button"
                        onClick={() => onChange(addFieldDayStarter(form))}
                      >
                        + Field Day starter
                      </button>
                      {SIGNUP_BLOCKS.map((block) => (
                        <EventEditorMenuCard
                          key={block.id}
                          title={`+ ${block.name}`}
                          desc={block.description}
                          onClick={() => add(block.id)}
                        />
                      ))}
                      <SignupContentEditor
                        form={form}
                        onChange={onChange}
                        drag={drag}
                        onDrag={setDrag}
                        onAdd={() => open("sections")}
                      />
                    </div>
                  )}
                </EventEditorSection>
              </div>
            )}
            {warnings.length > 0 && (
              <p className={styles.warning}>{warnings.map((issue) => issue.message).join(" ")}</p>
            )}
            {!form.enabled && (
              <button
                className={styles.secondary}
                type="button"
                onClick={() => onChange({ ...form, enabled: true })}
              >
                Reopen signups
              </button>
            )}
          </>
        }
      />
    </div>
  );
}
