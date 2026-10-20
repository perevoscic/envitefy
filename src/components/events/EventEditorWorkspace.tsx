"use client";

import { Eye, Pencil, PanelsTopLeft, ListPlus, Link2, X } from "lucide-react";
import { EventUrlEditor } from "./EventUrlEditor";
import { EventEditorMenuCard, EventEditorSection } from "./EventEditorFields";
import { EventPageCompositionProvider } from "./EventPageCompositionContext";
import {
  EventSectionBuilderProvider,
  EventSectionPalette,
  EventSectionsReadOnly,
  useEventSectionBuilder,
} from "./EventSectionBuilder";
import EventPageLayoutPicker from "./EventPageLayoutPicker";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { eventEditorActions } from "@/lib/event-editor";
import type { EventPageEditorSession } from "./useEventPageEditor";
import styles from "./event-editor.module.css";

type Drawer = Pick<
  ReturnType<typeof useMobileDrawer>,
  | "mobileMenuOpen"
  | "openMobileMenu"
  | "dismissMobileMenu"
  | "previewTouchHandlers"
  | "drawerTouchHandlers"
>;

export function EventEditorActions({ editor }: { editor: EventPageEditorSession }) {
  const actions = eventEditorActions(editor.published, editor.dirty);
  const disabled = editor.busy || !editor.ready;
  return (
    <div className={styles.actions} role="group" aria-label="Save event">
      <button type="button" disabled={disabled} onClick={editor.cancel}>
        Cancel
      </button>
      {actions.showDraft && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void editor.saveDraft().catch(() => {})}
        >
          {editor.authenticated ? "Save draft" : "Save and continue"}
        </button>
      )}
      {actions.showPrimary && editor.authenticated && (
        <button
          type="button"
          className={styles.primary}
          disabled={disabled}
          onClick={() => void editor.saveChanges().catch(() => {})}
        >
          {editor.busy ? "Saving…" : actions.primaryLabel}
        </button>
      )}
    </div>
  );
}

type EventEditorTool = "sections" | "layout" | "url";
type EventEditorTools = {
  openTool: (tool: EventEditorTool) => void;
  layout?: string;
  canEditUrl?: boolean;
};
const EventEditorToolsContext = createContext<EventEditorTools | null>(null);

/** Lets an editor place the shared settings tools inside its own menu instead of the default cards. */
export function EventEditorToolsConsumer({
  children,
}: {
  children: (tools: EventEditorTools) => ReactNode;
}) {
  const tools = useContext(EventEditorToolsContext);
  return tools ? children(tools) : null;
}

/** The same mounted preview, editing panel and actions for every authored Event Page. */
export default function EventEditorWorkspace({
  editor,
  preview,
  controls,
  children,
  drawer,
  embedded = false,
  notices,
  revealControls,
  sectionEditors,
  artwork,
  title,
  compositionMenu = "cards",
  customUrlMenu = true,
  pageEditing = false,
  viewLabels,
}: {
  editor: EventPageEditorSession;
  preview: ReactNode;
  controls: ReactNode | ((headerAction: ReactNode) => ReactNode);
  templatesHref?: string;
  drawer?: Drawer;
  embedded?: boolean;
  notices?: ReactNode;
  children?: ReactNode;
  revealControls?: string;
  sectionEditors?: Record<string, () => ReactNode>;
  artwork?: string;
  title?: string;
  /** "inline" hides the default cards; the controls render them through EventEditorToolsConsumer. */
  compositionMenu?: "cards" | "inline";
  /** Editors with an existing URL entry keep that entry instead of the shared card. */
  customUrlMenu?: boolean;
  /** The canvas stays editable when its settings panel is hidden. */
  pageEditing?: boolean;
  viewLabels?: { page: string; controls: string };
}) {
  const nativeBuilder = useEventSectionBuilder();
  const [tool, setTool] = useState<EventEditorTool | null>(null);
  const renderSectionEditor = (id: string) => {
    if (sectionEditors?.[id]) return sectionEditors[id]();
    const alias = /travel|getting.here/i.test(id)
      ? "travel"
      : /around.town|things.to.do/i.test(id)
        ? "thingsToDo"
        : /wedding.party/i.test(id)
          ? "party"
          : /story|notes|party|things|good.to.know/i.test(id)
            ? "details"
            : /photos|gallery/i.test(id)
              ? "photos"
              : /registry|gift/i.test(id)
                ? "registry"
                : /schedule/i.test(id)
                  ? "schedule"
                  : /hosts/i.test(id)
                    ? "hosts"
                    : /rsvp|attendance/i.test(id)
                      ? "rsvp"
                      : "details";
    return sectionEditors?.[alias]?.() || (typeof controls === "function" ? controls(null) : controls);
  };
  const [editing, setEditing] = useState(true);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const mobileEditing = drawer ? drawer.mobileMenuOpen : editing;
  const currentEditing = mobile ? mobileEditing : editing;
  useEffect(() => {
    if (editor.error || (revealControls && revealControls !== "main")) {
      setEditing(true);
      drawer?.openMobileMenu();
    }
  }, [editor.error, revealControls, drawer?.openMobileMenu]);
  const showEditing = () => {
    setEditing(true);
    drawer?.openMobileMenu();
  };
  const showPage = () => {
    setEditing(false);
    drawer?.dismissMobileMenu();
  };
  const inlineHeader = typeof controls === "function";
  const viewActions = !embedded && (
    <div className={styles.views} role="group" aria-label="Editor view">
      {currentEditing ? (
        <button
          type="button"
          onClick={showPage}
          className={pageEditing ? styles.closeSettings : undefined}
          aria-label={pageEditing ? viewLabels?.page || "Close settings" : undefined}
          title={pageEditing ? viewLabels?.page || "Close settings" : undefined}
        >
          {pageEditing ? <X size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          {!pageEditing && (viewLabels?.page || "Preview")}
        </button>
      ) : (
        <button type="button" onClick={showEditing}>
          {pageEditing ? <PanelsTopLeft size={17} aria-hidden="true" /> : <Pencil size={17} aria-hidden="true" />}
          {viewLabels?.controls || "Edit"}
        </button>
      )}
    </div>
  );
  const settingsInFooter = pageEditing && !currentEditing;
  const workspace = (
    <section
      className={styles.workspace}
      data-event-page-editor
      data-editing={editing}
      data-mobile-editing={mobileEditing}
      data-embedded={embedded}
      data-bottom-settings={settingsInFooter}
    >
      {editor.error && (
        <p className={styles.error} role="alert">
          {editor.error}
        </p>
      )}
      {editor.message && (
        <p className={styles.message} role="status">
          {editor.message}
        </p>
      )}
      {notices}
      <div className={styles.body}>
        {(!inlineHeader || !currentEditing) && !settingsInFooter && (
          <header className={styles.header}>{viewActions}</header>
        )}
        <div
          className={styles.preview}
          role="region"
          aria-label="Event page preview panel"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users must be able to scroll the page preview.
          tabIndex={0}
          inert={editor.busy ? true : undefined}
          {...drawer?.previewTouchHandlers}
        >
          <EventSectionsReadOnly readOnly={!currentEditing && !pageEditing}>{preview}</EventSectionsReadOnly>
        </div>
        <aside
          className={styles.panel}
          aria-label="Event editing controls"
          {...drawer?.drawerTouchHandlers}
        >
          <div
            className={styles.controls}
            data-inline-header={inlineHeader}
            inert={editor.busy ? true : undefined}
          >
            {editor.setComposition && sectionEditors && !tool && compositionMenu === "cards" && (
              <div className={styles.compositionMenu}>
                <EventEditorMenuCard
                  title="Page sections"
                  icon={<ListPlus size={20} />}
                  desc="Add, edit and move sections on your page."
                  onClick={() => setTool("sections")}
                />
                <EventEditorMenuCard
                  title="Layout"
                  icon={<PanelsTopLeft size={20} />}
                  desc="Choose an arrangement for your sections."
                  onClick={() => setTool("layout")}
                />
              </div>
            )}
            {customUrlMenu && editor.urlEditor && !tool && compositionMenu === "cards" && (
              <EventEditorMenuCard title="Custom URL" icon={<Link2 size={20} />} desc="Choose your shareable web address." onClick={() => setTool("url")} />
            )}
            {tool && (tool === "url" || editor.setComposition) && (
              <EventEditorSection
                title={tool === "url" ? "Custom URL" : tool === "layout" ? "Layout" : "Page sections"}
                onBack={() => setTool(null)}
              >
                {tool === "url" ? (
                  <EventUrlEditor eventId={editor.eventId} historyClient={editor.urlEditor?.historyClient} onUpdated={editor.urlEditor?.onUpdated} onBusyChange={editor.urlEditor?.onBusyChange} disabled={editor.busy} />
                ) : tool === "layout" ? (
                  <EventPageLayoutPicker
                    value={editor.composition}
                    onChange={editor.setComposition!}
                    artwork={artwork}
                    title={title}
                  />
                ) : (
                  <EventSectionPalette />
                )}
              </EventEditorSection>
            )}
            <div hidden={Boolean(tool)}>
              <EventEditorToolsContext.Provider
                value={
                  editor.setComposition && sectionEditors
                    ? { openTool: setTool, layout: editor.composition?.layout, canEditUrl: Boolean(editor.urlEditor) }
                    : null
                }
              >
                {typeof controls === "function" ? controls(viewActions) : controls}
              </EventEditorToolsContext.Provider>
            </div>
          </div>
        </aside>
        <footer className={styles.footer} data-bottom-settings={settingsInFooter}>
          {settingsInFooter && viewActions}
          <EventEditorActions editor={editor} />
        </footer>
      </div>
      {children}
    </section>
  );
  if (!editor.setComposition || !sectionEditors) return workspace;
  const composed = nativeBuilder ? (
    workspace
  ) : (
    <EventSectionBuilderProvider
      layout={editor.composition?.sectionLayout}
      onChange={(sectionLayout) =>
        editor.setComposition?.((previous) => ({
          version: 1,
          sections: [],
          ...previous,
          sectionLayout,
        }))
      }
      catalog={[]}
      renderEditor={renderSectionEditor}
    >
      {workspace}
    </EventSectionBuilderProvider>
  );
  return (
    <EventPageCompositionProvider
      value={editor.composition}
      onChange={editor.setComposition}
      renderEditor={renderSectionEditor}
    >
      {composed}
    </EventPageCompositionProvider>
  );
}
