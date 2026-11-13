"use client";

import { ArrowLeft, Check, CircleAlert, ExternalLink, Eye, Link2, ListPlus, LogOut, PanelsTopLeft, Pencil, Save, Share2, Trash2, Undo2, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import EventDeleteModal from "@/components/EventDeleteModal";
import { resolveNativeShareData } from "@/utils/native-share";
import { trackEventInteraction } from "@/utils/event-tracking-client";
import { createContext, type ReactNode, useContext, useEffect, useId, useRef, useState } from "react";
import type { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { eventEditorActions } from "@/lib/event-editor";
import { EventEditorImageControlsContext } from "./EventEditorImageControlsContext";
import { EventEditorCalendarContext } from "./EventEditorCalendarContext";
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

function EditorToast({ message, error }: { message: string; error: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (error || dismissed || hovered || focused) return;
    const timer = window.setTimeout(() => setDismissed(true), 6000);
    return () => window.clearTimeout(timer);
  }, [error, dismissed, hovered, focused]);

  if (dismissed) return null;
  return (
    <div
      className={styles.toast}
      data-editor-toast={error ? "error" : "success"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <span className={styles.toastIcon} aria-hidden="true">
        {error ? <CircleAlert size={24} /> : <Check size={24} strokeWidth={2.5} />}
      </span>
      <div className={styles.toastCopy} role={error ? "alert" : "status"} aria-atomic="true">
        {error && <strong>Action needed</strong>}
        <p>{message}</p>
      </div>
      <button
        type="button"
        className={styles.toastDismiss}
        aria-label="Dismiss notification"
        onClick={() => setDismissed(true)}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

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
  previewAction,
  onBack,
  showBack = true,
}: {
  editor: EventPageEditorSession;
  children?: ReactNode;
  previewAction?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}) {
  const actions = eventEditorActions(editor.published, editor.dirty);
  const disabled = editor.busy || !editor.ready;
  return (
    <div className={styles.actions} role="group" aria-label="Save event" data-published={editor.published} data-compact-save={editor.published && Boolean(editor.undo)}>
      {showBack && <button type="button" className={styles.mobileBack} disabled={disabled} onClick={onBack || editor.cancel}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back
      </button>}
      {children}
      {actions.showDraft && (
        <button
          type="button"
          disabled={disabled}
          aria-busy={editor.saveIntent === "draft"}
          onClick={() => void editor.saveDraft().catch(() => {})}
        >
          <Save size={17} aria-hidden="true" />
          {editor.saveIntent === "draft" ? "Saving draft…" : "Save draft"}
        </button>
      )}
      {actions.showPrimary && (
        <button
          type="button"
          className={styles.primary}
          disabled={disabled || actions.primaryDisabled}
          aria-busy={editor.saveIntent === "publish" || editor.saveIntent === "changes"}
          onClick={() => void editor.saveChanges().catch(() => {})}
        >
          {editor.published && <Save size={17} aria-hidden="true" />}
          {editor.saveIntent === "publish"
            ? "Publishing…"
            : editor.saveIntent === "changes" ? "Saving…" : actions.primaryLabel}
          {!editor.published && <ExternalLink size={17} aria-hidden="true" />}
        </button>
      )}
      {previewAction}
    </div>
  );
}

type EventEditorTool = "sections" | "layout" | "url";
type EventEditorTools = {
  openTool: (tool: EventEditorTool) => void;
  canEditUrl?: boolean;
  canEditSections?: boolean;
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

export function EventEditorPageSettings({ showImageLayout = true }: { showImageLayout?: boolean } = {}) {
  const tools = useContext(EventEditorToolsContext);
  if (!tools) return null;
  return <>
    {tools.canEditSections && <EventEditorMenuCard title="Page sections" desc="Add, edit and move sections." icon={<ListPlus size={20} />} onClick={() => tools.openTool("sections")} />}
    {showImageLayout && <EventEditorMenuCard title="Event image settings" desc="Upload an image and choose a design." icon={<PanelsTopLeft size={20} />} onClick={() => tools.openTool("layout")} />}
    {tools.canEditUrl && <EventEditorMenuCard title="Custom URL" desc="Choose your shareable web address." icon={<Link2 size={20} />} onClick={() => tools.openTool("url")} />}
  </>;
}

/** The same mounted preview, editing panel and actions for every authored Event Page. */
export default function EventEditorWorkspace({
  editor,
  preview,
  controls,
  controlsHeader,
  controlsTitle = "Edit event page",
  children,
  drawer,
  embedded = false,
  notices,
  revealControls,
  sectionEditors,
  artwork,
  title,
  compositionMenu = "inline",
  pageSectionsMenu = embedded || !preview,
  customUrlMenu = true,
  pageEditing = Boolean(preview),
  viewLabels,
  onBackWithinControls,
  imageControlsInMenu = true,
  imageControls,
}: {
  editor: EventPageEditorSession;
  preview: ReactNode;
  controls: ReactNode | ((headerAction: ReactNode) => ReactNode);
  controlsHeader?: ReactNode | ((headerAction: ReactNode) => ReactNode);
  controlsTitle?: string | null;
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
  /** Canvas-first editors expose the section library through their page instead. */
  pageSectionsMenu?: boolean;
  /** Editors with an existing URL entry keep that entry instead of the shared card. */
  customUrlMenu?: boolean;
  /** Page previews stay editable by default; embedded controls can opt out. */
  pageEditing?: boolean;
  viewLabels?: { page: string; controls: string };
  /** Return true after going back within the controls; shared tools request the main menu. */
  onBackWithinControls?: (toMainMenu?: boolean) => boolean;
  /** Editors with a dedicated image section can keep image actions there. */
  imageControlsInMenu?: boolean;
  imageControls?: ReactNode;
}) {
  const nativeBuilder = useEventSectionBuilder();
  const editingPanelId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewCloseRef = useRef<HTMLButtonElement>(null);
  const [tool, setTool] = useState<EventEditorTool | null>(null);
  const [undoOpen, setUndoOpen] = useState(false);
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
  const [editing, setEditing] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const previewReturnToControls = useRef(true);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [mobile, setMobile] = useState(false);
  const [imageControlsTarget, setImageControlsTarget] = useState<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const mobileEditing = embedded || (drawer ? drawer.mobileMenuOpen : editing);
  const currentEditing = mobile ? mobileEditing : editing;
  const readOnlyPreview = !embedded && (previewing || (!currentEditing && !pageEditing));
  useEffect(() => {
    const workspace = workspaceRef.current;
    const footer = footerRef.current;
    if (!workspace) return;
    if (!footer) { workspace.style.setProperty("--event-editor-footer-height", "0px"); return; }
    const measure = () => workspace.style.setProperty("--event-editor-footer-height", `${footer.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    return () => observer.disconnect();
  }, [readOnlyPreview]);
  useEffect(() => {
    if (readOnlyPreview) previewCloseRef.current?.focus({ preventScroll: true });
  }, [readOnlyPreview]);
  useEffect(() => {
    if (editor.error || (revealControls && revealControls !== "main")) {
      setEditing(true);
      drawer?.openMobileMenu();
    }
  }, [editor.error, revealControls, drawer?.openMobileMenu]);
  const showEditing = () => {
    setPreviewing(false);
    setEditing(true);
    drawer?.openMobileMenu();
    requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
  };
  const closePreview = () => {
    if (previewReturnToControls.current) showEditing();
    else showPage();
  };
  const showPage = () => {
    setPreviewing(false);
    setEditing(false);
    drawer?.dismissMobileMenu();
    requestAnimationFrame(() => (previewCloseRef.current || menuButtonRef.current || previewRef.current)?.focus({ preventScroll: true }));
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
  const inlineHeader = typeof controls === "function" || typeof controlsHeader === "function";
  const canvasEditor = pageEditing && !embedded;
  const renderExitButton = (left = false) => (
    <button type="button" disabled={editor.busy} onClick={editor.cancel}>
      <LogOut size={17} aria-hidden="true" className={left ? styles.exitLeftIcon : undefined} />
      {left ? "Exit Editing" : "Exit"}
    </button>
  );
  const exitButton = renderExitButton();
  const viewActions = !embedded && (
    <div className={styles.views} role="group" aria-label="Editor view" data-owner-actions={!currentEditing && Boolean(editor.ownerActions)}>
      {readOnlyPreview ? (<>
        <PreviewOwnerActions editor={editor} />
        <button ref={previewCloseRef} type="button" onClick={closePreview} className={styles.closeSettings} aria-label="Close preview" title="Close preview">
          <X size={20} aria-hidden="true" />
        </button>
      </>) : currentEditing ? (
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
        {canvasEditor && mobile && renderExitButton(true)}
        <button ref={menuButtonRef} type="button" onClick={showEditing} aria-label={pageEditing ? "Continue editing" : undefined}
          aria-expanded={currentEditing} aria-controls={editingPanelId}>
          {pageEditing ? (
            mobile ? <Pencil size={17} aria-hidden="true" /> : <PanelsTopLeft size={17} aria-hidden="true" />
          ) : (
            <Pencil size={17} aria-hidden="true" />
          )}
          {pageEditing ? "Continue editing" : viewLabels?.controls || "Edit"}
        </button>
        {!canvasEditor && <PreviewOwnerActions editor={editor} />}
        {canvasEditor && !mobile && exitButton}
      </>)}
    </div>
  );
  const settingsInFooter = pageEditing && !currentEditing && !readOnlyPreview;
  const workspace = (
    <EventEditorCalendarContext.Provider value={editor.calendarFields || null}>
    <EventEditorImageControlsContext.Provider value={imageControlsInMenu ? imageControlsTarget : null}>
    <section
      ref={workspaceRef}
      className={styles.workspace}
      data-event-page-editor
      data-editing={editing}
      data-mobile-editing={mobileEditing}
      data-embedded={embedded}
      data-bottom-settings={settingsInFooter}
      data-page-editing={pageEditing}
      data-previewing={readOnlyPreview}
      data-entered={entered}
      role={mobile && canvasEditor && currentEditing ? "dialog" : undefined}
      aria-modal={mobile && canvasEditor && currentEditing ? true : undefined}
      aria-label={mobile && canvasEditor && currentEditing ? controlsTitle || "Edit event page" : undefined}
      onKeyDown={(event) => {
        if (mobile && canvasEditor && currentEditing && !event.defaultPrevented) {
          if (event.key === "Escape") { event.preventDefault(); goBack(); return; }
          if (event.key === "Tab") {
            const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("aside button:not(:disabled), aside input:not(:disabled), aside textarea:not(:disabled), aside select:not(:disabled), aside a[href], footer button:not(:disabled)")]
              .filter(element => element.getClientRects().length && !element.closest("[hidden], [inert]"));
            const first = controls[0], last = controls[controls.length - 1];
            if (first && last && (!controls.includes(document.activeElement as HTMLElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))) {
              event.preventDefault(); (event.shiftKey ? last : first).focus();
            }
          }
        }
        if (readOnlyPreview && event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          closePreview();
        }
      }}
    >
      {notices}
      <div className={styles.body}>
        {!embedded && (readOnlyPreview || (pageEditing && !currentEditing)) && (
          <header className={styles.header}>
            {viewActions}
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
          inert={editor.busy || (mobile && currentEditing) ? true : undefined}
          {...drawer?.previewTouchHandlers}
        >
          <EventSectionsReadOnly readOnly={readOnlyPreview}>
            {preview}
          </EventSectionsReadOnly>
        </div>
        {mobile && canvasEditor && currentEditing && <button type="button" className={styles.menuBackdrop} aria-label="Close editing menu" onClick={showPage} />}
        <aside
          id={editingPanelId}
          className={styles.panel}
          ref={panelRef}
          tabIndex={-1}
          aria-label="Event editing controls"
          inert={!currentEditing ? true : undefined}
          {...drawer?.drawerTouchHandlers}
        >
          {canvasEditor && (
            <div className={`${styles.panelNavigation} ${styles.views}`} role="group" aria-label="Editor view">
              <div className={`${styles.navigationRow} ${styles.desktopNavigation}`}>
                <button type="button" disabled={editor.busy} onClick={showPage} aria-label="Close editing menu" title="Close editing menu">
                  <X size={20} aria-hidden="true" />
                </button>
                <button type="button" disabled={editor.busy} onClick={editor.cancel}>
                  <LogOut size={17} aria-hidden="true" />Exit editing
                </button>
              </div>
              <div className={`${styles.navigationRow} ${styles.mobileNavigation}`}>
                <button type="button" disabled={editor.busy} onClick={showPage} aria-label="Back to page">
                  <ArrowLeft size={17} aria-hidden="true" />Page
                </button>
                <span className={styles.navigationTitle}>Edit page</span>
                {exitButton}
              </div>
            </div>
          )}
          <div
            className={styles.controls}
            data-inline-header={inlineHeader}
            inert={editor.busy ? true : undefined}
          >
            {!canvasEditor && (typeof controlsHeader === "function"
              ? controlsHeader(null)
              : controlsHeader)}
            {compositionMenu === "cards" &&
              ((editor.setComposition && sectionEditors) ||
                (customUrlMenu && editor.urlEditor)) && (
                <EventEditorToolsRow>
                  {editor.setComposition && sectionEditors && (
                    <>
                      {pageSectionsMenu && <EventEditorMenuCard
                        compact
                        active={tool === "sections"}
                        title="Page sections"
                        icon={<ListPlus size={20} />}
                        desc="Add, edit and move sections on your page."
                        onClick={() => setTool("sections")}
                      />}
                      <EventEditorMenuCard
                        compact
                        active={tool === "layout"}
                        title="Event image settings"
                        icon={<PanelsTopLeft size={20} />}
                        desc="Upload an image and choose a design."
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
                  (panel === "sections" && nativeBuilder) ||
                  (panel !== "url" && editor.setComposition && sectionEditors)) && (
                  <div key={panel} hidden={tool !== panel} className={styles.toolPanel}>
                    <EventEditorSection
                      title={
                        panel === "url"
                          ? "Custom URL"
                          : panel === "layout"
                            ? "Event image settings"
                            : "Page sections"
                      }
                      onBack={closeTool}
                    >
                      {panel === "url" ? (
                        <EventUrlEditor
                          eventId={editor.eventId}
                          historyClient={editor.urlEditor?.historyClient}
                          onUpdated={editor.urlEditor?.onUpdated}
                          onBusyChange={editor.urlEditor?.onBusyChange}
                          disabled={editor.busy}
                        />
                      ) : panel === "layout" ? (<>
                        {(imageControls || imageControlsInMenu) && <div className={styles.imageSettingsControls}>
                          {imageControls}
                          {imageControlsInMenu && <div ref={setImageControlsTarget} />}
                        </div>}
                        <EventPageLayoutPicker
                          value={editor.composition}
                          onChange={editor.setComposition!}
                          artwork={artwork}
                          title={title}
                        />
                        </>
                      ) : (
                        <EventSectionPalette />
                      )}
                    </EventEditorSection>
                  </div>
                ),
            )}
            <div hidden={Boolean(tool)} className={styles.menuContent}>
              {canvasEditor && (nativeBuilder || (editor.setComposition && sectionEditors)) && <div className={styles.mobileSections}>
                <EventEditorMenuCard title="Sections" desc="Add, rename and organize page sections." icon={<ListPlus size={20} />} onClick={() => setTool("sections")} />
              </div>}
              <EventEditorToolsContext.Provider
                value={
                  editor.setComposition && sectionEditors
                    ? {
                        openTool: setTool,
                        canEditUrl: Boolean(customUrlMenu && editor.urlEditor),
                        canEditSections: pageSectionsMenu,
                      }
                    : null
                }
              >
                {typeof controls === "function"
                  ? controls(null)
                  : controls}
              </EventEditorToolsContext.Provider>
            </div>
          </div>
        </aside>
        {!readOnlyPreview && <footer ref={footerRef} className={styles.footer} data-bottom-settings={settingsInFooter}>
          {(editor.error || editor.message) && (
            <div className={styles.toastPosition}>
              <EditorToast
                key={`${editor.error}:${editor.message}`}
                message={editor.error || editor.message}
                error={Boolean(editor.error)}
              />
            </div>
          )}
          {pageEditing && !canvasEditor && viewActions}
          <EventEditorActions editor={editor} onBack={goBack} showBack={!canvasEditor}
            previewAction={!embedded && !previewing && currentEditing && (
              <button type="button" className={styles.previewAction} disabled={editor.busy} onClick={() => {
                previewReturnToControls.current = currentEditing;
                showPage();
                setPreviewing(true);
              }}><Eye size={17} aria-hidden="true" />Preview</button>
            )}
          >
            {!pageEditing && !currentEditing && viewActions}
            {editor.undo && (currentEditing || editor.dirty) && (
              <Dialog.Root open={undoOpen} onOpenChange={setUndoOpen}>
                <Dialog.Trigger asChild>
                  <button type="button" disabled={editor.busy || !editor.ready || !editor.undo.canUndo}>
                    <Undo2 size={17} aria-hidden="true" />Undo
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className={styles.undoOverlay} />
                  <Dialog.Content className={styles.undoMenu}>
                    <Dialog.Title>Undo changes</Dialog.Title>
                    <Dialog.Description>Restore your last change, or all changes since opening this editor or your latest save.</Dialog.Description>
                    <button type="button" className={styles.undoItem} onClick={() => { setUndoOpen(false); editor.undo?.last(); }}>Undo last change</button>
                    <button type="button" className={styles.undoItem} onClick={() => { setUndoOpen(false); editor.undo?.all(); }}>Undo all unsaved changes</button>
                    <Dialog.Close asChild><button type="button" className={styles.undoItem}>Keep editing</button></Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            )}
            {!canvasEditor && (currentEditing || editor.dirty) && (
              <button
                type="button"
                disabled={editor.busy}
                onClick={editor.cancel}
              >
                {pageEditing && <X size={17} aria-hidden="true" />}
                Cancel
              </button>
            )}
          </EventEditorActions>
        </footer>}
      </div>
      {children}
    </section>
    </EventEditorImageControlsContext.Provider>
    </EventEditorCalendarContext.Provider>
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
