"use client";

import { ArrowLeft, ExternalLink, Eye, Link2, ListPlus, PanelsTopLeft, Pencil, Save, Share2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import EventDeleteModal from "@/components/EventDeleteModal";
import { useTemplateEditor } from "@/components/templates/TemplateEditorContext";
import { resolveNativeShareData } from "@/utils/native-share";
import { trackEventInteraction } from "@/utils/event-tracking-client";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import type { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { eventEditorActions } from "@/lib/event-editor";
import { EventEditorImageControlsContext } from "./EventEditorImageControlsContext";
import { EventEditorMenuCard, EventEditorSection, EventEditorToolsRow } from "./EventEditorFields";
import { EventPageCompositionProvider } from "./EventPageCompositionContext";
import EventPageLayoutPicker from "./EventPageLayoutPicker";
import {
  EventSectionBuilderProvider,
  EventSectionPalette,
  EventSectionsReadOnly,
  useEventSectionBuilder,
} from "./EventSectionBuilder";
import { EventUrlEditor } from "./EventUrlEditor";
import styles from "./event-editor.module.css";
import type { EventPageEditorSession } from "./useEventPageEditor";

type Drawer = Pick<
  ReturnType<typeof useMobileDrawer>,
  | "mobileMenuOpen"
  | "openMobileMenu"
  | "dismissMobileMenu"
  | "previewTouchHandlers"
  | "drawerTouchHandlers"
>;

function PreviewOwnerActions({ editor }: { editor: EventPageEditorSession }) {
  const [copied, setCopied] = useState(false);
  if (!editor.eventId || !editor.ownerActions || !editor.authenticated || !editor.ready) return null;
  const { title, shareHref } = editor.ownerActions;
  const share = async () => {
    const url = new URL(shareHref, window.location.origin).href;
    trackEventInteraction({ eventId: editor.eventId!, eventName: "share_link_click", targetUrl: url, targetLabel: title, sourceSurface: "editor_preview" });
    try {
      const nativeData = resolveNativeShareData({ title, url });
      if (nativeData) await navigator.share(nativeData);
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      window.prompt("Copy your event link:", url);
    }
  };
  return <>
    <button type="button" onClick={() => void share()} disabled={editor.busy} aria-label="Share event">
      <Share2 size={17} aria-hidden="true" />
      <span role="status">{copied ? "Copied" : "Share"}</span>
    </button>
    <EventDeleteModal eventId={editor.eventId} eventTitle={title} ariaLabel="Delete event">
      <Trash2 size={17} aria-hidden="true" />
      <span>Delete</span>
    </EventDeleteModal>
  </>;
}

export function EventEditorActions({
  editor,
  children,
  onBack,
}: {
  editor: EventPageEditorSession;
  children?: ReactNode;
  onBack?: () => void;
}) {
  const actions = eventEditorActions(editor.published, editor.dirty);
  const disabled = editor.busy || !editor.ready;
  return (
    <div className={styles.actions} role="group" aria-label="Save event">
      <button type="button" hidden disabled={disabled} onClick={onBack || editor.cancel}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back
      </button>
      {children}
      {actions.showDraft && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void editor.saveDraft().catch(() => {})}
        >
          <Save size={17} aria-hidden="true" />
          Save draft
        </button>
      )}
      {actions.showPrimary && (
        <button
          type="button"
          className={styles.primary}
          disabled={disabled}
          onClick={() => void editor.saveChanges().catch(() => {})}
        >
          {editor.busy ? "Saving…" : actions.primaryLabel}
          {!editor.published && <ExternalLink size={17} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}

type EventEditorTool = "sections" | "layout" | "url";
type EventEditorTools = {
  openTool: (tool: EventEditorTool) => void;
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
  onBackWithinControls,
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
  /** Return true after going back within the controls; shared tools request the main menu. */
  onBackWithinControls?: (toMainMenu?: boolean) => boolean;
}) {
  const router = useRouter();
  const template = useTemplateEditor();
  const guestExit = !embedded && template && !template.authenticated;
  const nativeBuilder = useEventSectionBuilder();
  const panelRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
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
    return (
      sectionEditors?.[alias]?.() || (typeof controls === "function" ? controls(null) : controls)
    );
  };
  const [editing, setEditing] = useState(embedded || !pageEditing);
  const [mobile, setMobile] = useState(false);
  const [mobileImageControls, setMobileImageControls] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const mobileEditing = embedded || (drawer ? drawer.mobileMenuOpen : editing);
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
    requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
  };
  const showPage = () => {
    setEditing(false);
    drawer?.dismissMobileMenu();
    requestAnimationFrame(() => previewRef.current?.focus({ preventScroll: true }));
  };
  const focusControlsMenu = () => {
    requestAnimationFrame(() => {
      if (!panelRef.current) return;
      panelRef.current.scrollTop = 0;
      panelRef.current.focus({ preventScroll: true });
    });
  };
  const closeTool = () => {
    setTool(null);
    onBackWithinControls?.(true);
    focusControlsMenu();
  };
  const goBack = () => {
    if (currentEditing) {
      if (tool) {
        closeTool();
        return;
      }
      if (onBackWithinControls?.()) {
        focusControlsMenu();
        return;
      }
      if (!embedded) {
        showPage();
        return;
      }
    }
    editor.cancel();
  };
  const inlineHeader = typeof controls === "function";
  const viewActions = !embedded && (
    <div className={styles.views} role="group" aria-label="Editor view" data-owner-actions={!currentEditing && Boolean(editor.ownerActions)}>
      {currentEditing ? (
        <button
          type="button"
          onClick={showPage}
          className={pageEditing ? styles.closeSettings : undefined}
          aria-label={pageEditing ? viewLabels?.page || "Close settings" : undefined}
          title={pageEditing ? viewLabels?.page || "Close settings" : undefined}
        >
          {pageEditing ? (
            <X size={17} aria-hidden="true" />
          ) : (
            <>
              <Eye size={17} aria-hidden="true" />
              {viewLabels?.page || "Preview"}
            </>
          )}
        </button>
      ) : (<>
        <button type="button" onClick={showEditing}>
          {pageEditing ? (
            <PanelsTopLeft size={17} aria-hidden="true" />
          ) : (
            <Pencil size={17} aria-hidden="true" />
          )}
          {viewLabels?.controls || "Edit"}
        </button>
        <PreviewOwnerActions editor={editor} />
      </>)}
    </div>
  );
  const settingsInFooter = pageEditing && !currentEditing;
  const workspace = (
    <EventEditorImageControlsContext.Provider value={mobile && currentEditing ? mobileImageControls : null}>
    <section
      className={styles.workspace}
      data-event-page-editor
      data-editing={editing}
      data-mobile-editing={mobileEditing}
      data-embedded={embedded}
      data-bottom-settings={settingsInFooter}
      data-page-editing={pageEditing}
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
        {!embedded && pageEditing && (
          <header className={styles.header}>
            {(!inlineHeader || !currentEditing) && !settingsInFooter && viewActions}
          </header>
        )}
        <div
          className={styles.preview}
          ref={previewRef}
          data-appearance-scope="authored"
          role="region"
          aria-label="Event page preview panel"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users must be able to scroll the page preview.
          tabIndex={0}
          inert={editor.busy ? true : undefined}
          {...drawer?.previewTouchHandlers}
        >
          <EventSectionsReadOnly readOnly={!currentEditing && !pageEditing}>
            {preview}
          </EventSectionsReadOnly>
        </div>
        <aside
          className={styles.panel}
          ref={panelRef}
          tabIndex={-1}
          aria-label="Event editing controls"
          {...drawer?.drawerTouchHandlers}
        >
          <div
            className={styles.controls}
            data-inline-header={inlineHeader}
            inert={editor.busy ? true : undefined}
          >
            <div ref={setMobileImageControls} className={styles.mobileImageControls} />
            {compositionMenu === "cards" &&
              ((editor.setComposition && sectionEditors) ||
                (customUrlMenu && editor.urlEditor)) && (
                <EventEditorToolsRow>
                  {editor.setComposition && sectionEditors && (
                    <>
                      <EventEditorMenuCard
                        compact
                        active={tool === "sections"}
                        title="Page sections"
                        icon={<ListPlus size={20} />}
                        desc="Add, edit and move sections on your page."
                        onClick={() => setTool("sections")}
                      />
                      <EventEditorMenuCard
                        compact
                        active={tool === "layout"}
                        title="Layout"
                        icon={<PanelsTopLeft size={20} />}
                        desc="Arrange your hero image and title."
                        onClick={() => setTool("layout")}
                      />
                    </>
                  )}
                  {customUrlMenu && editor.urlEditor && (
                    <EventEditorMenuCard
                      compact
                      active={tool === "url"}
                      title="Custom URL"
                      icon={<Link2 size={20} />}
                      desc="Choose your shareable web address."
                      onClick={() => setTool("url")}
                    />
                  )}
                </EventEditorToolsRow>
              )}
            {(["sections", "layout", "url"] as const).map(
              (panel) =>
                ((panel === "url" && customUrlMenu && editor.urlEditor) ||
                  (panel !== "url" && editor.setComposition && sectionEditors)) && (
                  <div key={panel} hidden={tool !== panel} className={styles.toolPanel}>
                    <EventEditorSection
                      title={
                        panel === "url"
                          ? "Custom URL"
                          : panel === "layout"
                            ? "Layout"
                            : "Page sections"
                      }
                      onBack={closeTool}
                      action={panel === "layout" && editor.composition?.hero ? (
                        <button
                          type="button"
                          data-section-reset
                          onClick={() => editor.setComposition?.((previous) =>
                            previous ? { ...previous, hero: undefined } : previous,
                          )}
                        >
                          Reset
                        </button>
                      ) : undefined}
                    >
                      {panel === "url" ? (
                        <EventUrlEditor
                          eventId={editor.eventId}
                          historyClient={editor.urlEditor?.historyClient}
                          onUpdated={editor.urlEditor?.onUpdated}
                          onBusyChange={editor.urlEditor?.onBusyChange}
                          disabled={editor.busy}
                        />
                      ) : panel === "layout" ? (
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
                  </div>
                ),
            )}
            <div hidden={Boolean(tool)} className={styles.menuContent}>
              <EventEditorToolsContext.Provider
                value={
                  editor.setComposition && sectionEditors
                    ? {
                        openTool: setTool,
                        canEditUrl: Boolean(editor.urlEditor),
                      }
                    : null
                }
              >
                {typeof controls === "function"
                  ? controls(pageEditing ? viewActions : null)
                  : controls}
              </EventEditorToolsContext.Provider>
            </div>
          </div>
        </aside>
        <footer className={styles.footer} data-bottom-settings={settingsInFooter}>
          {pageEditing && viewActions}
          <EventEditorActions editor={editor} onBack={goBack}>
            {guestExit && (
              <button
                type="button"
                disabled={editor.busy || !editor.ready}
                onClick={() => router.push(`/${template.category}/templates`)}
              >
                Cancel
              </button>
            )}
            {!pageEditing && viewActions}
          </EventEditorActions>
        </footer>
      </div>
      {children}
    </section>
    </EventEditorImageControlsContext.Provider>
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
