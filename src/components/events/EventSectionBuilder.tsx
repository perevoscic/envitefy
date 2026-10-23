"use client";
import { EventSectionEditorClose as EditorClose, EventSectionEditorBusy } from "./EventSectionEditorContext";
import {
  EventPageCompositionProvider,
  useEventPageComposition,
  type EventPageCompositionRuntime,
} from "./EventPageCompositionContext";
import { EventEditorInput } from "./EventEditorFields";
import { EventPageReadOnlyProvider } from "./EventPageReadOnlyContext";
import EventArrivalMap from "./custom/EventArrivalMap";
import EventSectionExtrasEditor from "./EventSectionExtrasEditor";
import EventSectionExtrasContent from "./EventSectionExtrasContent";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Columns2,
  GripVertical,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import {
  changeEventSectionLayout,
  groupEventSectionRows,
  orderEventSections,
  type EventSectionLayout,
  type EventSectionChange,
} from "@/lib/event-section-layout";
import {
  availableEventInformationPresets,
  type EventInformationSectionContent,
  type EventInformationSectionPreset,
} from "@/lib/event-information-section-presets";
import styles from "./event-section-builder.module.css";

export type EventSectionOption = { id: string; label: string; editorId?: string };
export type EventSectionEntry = EventSectionOption & { content: ReactNode };
type BuilderContext = {
  layout?: EventSectionLayout;
  catalog: readonly EventSectionOption[];
  entries: EventSectionOption[];
  register: (entries: EventSectionOption[]) => void;
  change: (change: EventSectionChange) => void;
  edit: (section: EventSectionOption) => void;
  addAt: (index: number) => void;
  add: (section: EventSectionOption, index: number) => void;
  placeBeside: (section: EventSectionOption) => void;
  createSection?: (content: EventInformationSectionContent) => EventSectionOption | undefined;
  sectionLimitReached?: boolean;
};
const Builder = createContext<BuilderContext | null>(null);
// Keyboard movement advances between whole sections, skipping the mouse drop gaps.
const sectionKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const rectangles = new Map(
    [...args.context.droppableRects].filter(([id]) => String(id).startsWith("section:")),
  );
  return sortableKeyboardCoordinates(event, {
    ...args,
    context: { ...args.context, droppableRects: rectangles },
  });
};
export const useEventSectionBuilder = () => useContext(Builder);

function InformationSectionEditor({ id, fallback }: { id: string; fallback: ReactNode }) {
  const composition = useEventPageComposition();
  const section = composition?.value?.sections.find((item) => item.id === id);
  if (!section || !composition?.onChange) return <>{fallback}</>;
  const update = (patch: Partial<typeof section>) =>
    composition.onChange?.({
      ...composition.value!,
      sections: composition.value!.sections.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  return (
    <>
      <EventEditorInput
        label="Section heading"
        value={section.title}
        onChange={(title) => update({ title })}
        maxLength={240}
      />
      <EventEditorInput
        label="Section content"
        type="textarea"
        value={section.body}
        onChange={(body) => update({ body })}
        maxLength={12000}
      />
      <EventSectionExtrasEditor key={section.id} value={section} onChange={update} />
    </>
  );
}
function AddInformationSection({
  index,
  preset,
}: {
  index: number;
  preset?: EventInformationSectionPreset;
}) {
  const composition = useEventPageComposition();
  const builder = useEventSectionBuilder();
  if (!builder || (!composition?.onChange && !builder.createSection)) return null;
  return (
    <button
      type="button"
      className={styles.informationChoice}
      disabled={builder.sectionLimitReached || (composition?.value?.sections.length || 0) >= 20}
      onClick={() => {
        const kind = preset && "kind" in preset ? preset.kind : undefined;
        const content: EventInformationSectionContent = {
          title: preset?.title || "Information",
          body: "",
          ...(kind === "photos" ? { kind, photos: [] } : kind === "links" ? { kind, links: [] } : {}),
        };
        if (builder.createSection) {
          const section = builder.createSection(content);
          if (section) builder.add(section, index);
          return;
        }
        const section = { id: `info:${crypto.randomUUID()}`, ...content };
        composition?.onChange?.({
          version: 1,
          ...composition.value,
          sections: [...(composition.value?.sections || []), section],
        });
        // The surrounding provider keeps native category composition and information sections in the same order.
        builder.add({ id: section.id, label: section.title }, index);
      }}
    >
      <Plus size={18} aria-hidden="true" />
      <span>
        {preset?.title || "Other"}
        <small>{preset?.description || "Add your own heading and information"}</small>
      </span>
    </button>
  );
}
function InformationSectionChoices({ index }: { index: number }) {
  const builder = useEventSectionBuilder();
  const composition = useEventPageComposition();
  if (!builder || (!composition?.onChange && !builder.createSection)) return null;
  const presets = availableEventInformationPresets([...builder.catalog, ...builder.entries]);
  const limitReached = builder.sectionLimitReached || (composition?.value?.sections.length || 0) >= 20;
  return (
    <>
      <div className={`${styles.choices} ${styles.informationChoices}`} role="group" aria-label="Predefined sections">
        {presets.map((preset) => (
          <AddInformationSection key={preset.title} index={index} preset={preset} />
        ))}
        <AddInformationSection index={index} />
      </div>
      {limitReached && (
        <div className={styles.limitNotice} role="status">
          You have reached the 20 custom section limit. You can still edit or restore existing sections.
        </div>
      )}
    </>
  );
}
export { useSectionEditorClose } from "./EventSectionEditorContext";

export function EventSectionsReadOnly({
  children,
  readOnly = true,
}: {
  children: ReactNode;
  readOnly?: boolean;
}) {
  const builder = useContext(Builder);
  return (
    <EventPageReadOnlyProvider readOnly={readOnly}>
      <Builder.Provider value={readOnly ? null : builder}>{children}</Builder.Provider>
    </EventPageReadOnlyProvider>
  );
}

export function EventSectionBuilderProvider({
  layout,
  onChange,
  catalog,
  renderEditor,
  createSection,
  sectionLimitReached,
  initialEntries,
  composition,
  children,
}: {
  layout?: EventSectionLayout;
  onChange: (layout: EventSectionLayout | undefined) => void;
  catalog: readonly EventSectionOption[];
  renderEditor: (id: string) => ReactNode;
  createSection?: (content: EventInformationSectionContent) => EventSectionOption | undefined;
  sectionLimitReached?: boolean;
  initialEntries?: EventSectionOption[];
  composition?: EventPageCompositionRuntime;
  children: ReactNode;
}) {
  const [registeredEntries, setEntries] = useState<EventSectionOption[]>([]);
  const entries = initialEntries || registeredEntries;
  const [panel, setPanel] = useState<
    { kind: "add"; index: number } | { kind: "edit" | "beside"; section: EventSectionOption } | null
  >(null);
  const [dragLabel, setDragLabel] = useState("");
  const [sectionBusy, setSectionBusy] = useState(false);
  const [notice, setNotice] = useState<{ message: string } | null>(null);
  const [undo, setUndo] = useState<Array<EventSectionLayout | undefined>>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const focusReturn = useRef<HTMLElement | null>(null);
  const editedSectionId = useRef<string | null>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sectionKeyboardCoordinates }),
  );
  const register = useCallback((next: EventSectionOption[]) => {
    setEntries((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
  }, []);
  const close = useCallback(() => {
    if (!sectionBusy) setPanel(null);
  }, [sectionBusy]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  const rememberFocus = useCallback(() => {
    if (!dialog.current?.open)
      focusReturn.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (panel && element) {
      if (!element.open) {
        element.showModal();
      } else if (!element.contains(document.activeElement)) {
        element.querySelector<HTMLElement>("input, textarea, select, button")?.focus();
      }
    } else if (!panel && element?.open) {
      element.close();
      if (focusReturn.current?.isConnected) focusReturn.current.focus({ preventScroll: true });
      else {
        // A newly added preset leaves the choices list. Return to its mounted Edit action.
        const editButton = [...document.querySelectorAll<HTMLButtonElement>("button[data-section-editor-id]")]
          .find((button) => button.dataset.sectionEditorId === editedSectionId.current && button.getClientRects().length);
        editButton?.focus({ preventScroll: true });
      }
    }
  }, [panel]);
  const visible = useMemo(
    () =>
      orderEventSections(
        [
          ...entries,
          ...catalog.filter(
            (item) =>
              layout?.added.includes(item.id) && !entries.some((entry) => entry.id === item.id),
          ),
        ],
        layout,
      ),
    [entries, catalog, layout],
  );
  const change = useCallback(
    (action: EventSectionChange) => {
      const previousLayout =
        action.type === "add"
          ? {
              version: 1 as const,
              order: visible.map((entry) => entry.id),
              added: [],
              ...layout,
              hidden: [...new Set([...(layout?.hidden || []), action.id])],
            }
          : layout;
      setUndo((previous) => [...previous.slice(-19), previousLayout]);
      onChange(
        changeEventSectionLayout(
          layout,
          visible.map((entry) => entry.id),
          action,
        ),
      );
      const label =
        [...catalog, ...entries].find((item) => item.id === action.id)?.label || "Section";
      setNotice({
        message: `${label} ${action.type === "remove" ? "removed from page" : action.type === "add" ? "added" : action.type === "resize" ? "width updated" : action.type === "pair" ? "placed beside section" : action.type === "unpair" ? "moved to its own row" : "moved"}.`,
      });
      if (action.type === "remove")
        requestAnimationFrame(() => undoButton.current?.focus({ preventScroll: true }));
    },
    [layout, visible, onChange, catalog, entries],
  );
  const edit = useCallback(
    (section: EventSectionOption) => {
      rememberFocus();
      editedSectionId.current = section.id;
      setPanel({ kind: "edit", section });
    },
    [rememberFocus],
  );
  const addAt = useCallback((index: number) => {
    rememberFocus();
    setPanel({ kind: "add", index });
  }, [rememberFocus]);
  const placeBeside = useCallback(
    (section: EventSectionOption) => {
      rememberFocus();
      setPanel({ kind: "beside", section });
    },
    [rememberFocus],
  );
  const add = useCallback(
    (section: EventSectionOption, index: number) => {
      if (!visible.some((item) => item.id === section.id))
        change({ type: "add", id: section.id, index });
      edit(section);
    },
    [visible, change, edit],
  );
  const value = useMemo(
    () => ({
      layout,
      catalog,
      entries,
      register,
      change,
      edit,
      addAt,
      add,
      placeBeside,
      createSection,
      sectionLimitReached,
    }),
    [layout, catalog, entries, register, change, edit, addAt, add, placeBeside, createSection, sectionLimitReached],
  );
  function onDragEnd(event: DragEndEvent) {
    setDragLabel("");
    const { active, over } = event;
    if (!over) return;
    const id = String(active.id).replace(/^(catalog|section):/, "");
    const target = String(over.id);
    const oldIndex = visible.findIndex((item) => item.id === id);
    let index = target.startsWith("insert:")
      ? Number(target.slice(7))
      : visible.findIndex((item) => `section:${item.id}` === target);
    if (index < 0 || !Number.isFinite(index)) return;
    if (target.startsWith("insert:") && oldIndex >= 0 && oldIndex < index) index--;
    if (String(active.id).startsWith("catalog:") && oldIndex < 0) {
      const section = catalog.find((item) => item.id === id);
      if (section) add(section, index);
    } else if (oldIndex !== index) change({ type: "move", id, index });
  }
  const content = (
    <Builder.Provider value={value}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragLabel("")}
        onDragStart={({ active }) =>
          setDragLabel(
            [...catalog, ...entries].find(
              (item) => item.id === String(active.id).replace(/^(catalog|section):/, ""),
            )?.label || "Section",
          )
        }
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Press space to pick up a section. Use arrow keys to move it, space to drop, or Escape to cancel. The section menu also has Move up and Move down buttons.",
          },
        }}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {dragLabel ? (
            <div className={styles.dragOverlay}>
              <GripVertical size={18} />
              {dragLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {notice ? (
        <div className={styles.notice}>
          <span role="status">{notice.message}</span>
          {undo.length ? (
            <button
              ref={undoButton}
              type="button"
              onClick={() => {
                const previous = undo[undo.length - 1];
                setUndo((history) => history.slice(0, -1));
                onChange(previous);
                setNotice({ message: "Section change undone." });
              }}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Undo
            </button>
          ) : null}
          <button
            type="button"
            className={styles.noticeDismiss}
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <dialog
        data-appearance-scope="app"
        data-app-dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={titleId}
        onCancel={(event) => { event.preventDefault(); close(); }}
        onClose={close}
      >
        <div className={styles.dialogHeader}>
          <h2 id={titleId}>
            {panel?.kind === "edit"
              ? panel.section.label
              : panel?.kind === "beside"
                ? `Place beside ${panel.section.label}`
                : "Add section"}
          </h2>
          <button type="button" onClick={close} disabled={sectionBusy} aria-label="Close section panel">
            <X size={20} />
          </button>
        </div>
        <div className={styles.dialogBody}>
          {panel?.kind === "beside" ? (
            <>
              <p className={styles.layoutHelp}>
                Choose a section to share this row. Sections stack on small screens.
              </p>
              <div className={styles.choices}>
                {[
                  ...visible,
                  ...catalog.filter((item) => !visible.some((entry) => entry.id === item.id)),
                ]
                  .filter((section) => section.id !== panel.section.id)
                  .map((section) => (
                    <button
                      type="button"
                      key={section.id}
                      onClick={() => {
                        const existing = visible.some((item) => item.id === section.id);
                        change({ type: "pair", id: section.id, besideId: panel.section.id });
                        if (existing) close();
                        else edit(section);
                      }}
                    >
                      <Columns2 size={18} aria-hidden="true" />
                      <span>
                        {section.label}
                        <small>
                          {visible.some((item) => item.id === section.id)
                            ? "Move beside"
                            : layout?.hidden.includes(section.id)
                              ? "Restore beside"
                              : "Add beside"}
                        </small>
                      </span>
                    </button>
                  ))}
              </div>
            </>
          ) : panel?.kind === "add" ? (
            <>
              <div className={styles.choices}>
                {[
                  ...catalog,
                  ...entries.filter((entry) => !catalog.some((item) => item.id === entry.id)),
                ].map((section) => (
                  <button type="button" key={section.id} onClick={() => add(section, panel.index)}>
                    <Plus size={18} aria-hidden="true" />
                    <span>
                      {section.label}
                      {visible.some((item) => item.id === section.id) ? (
                        <small>Already on page · Edit</small>
                      ) : layout?.hidden.includes(section.id) ? (
                        <small>Restore section</small>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
              <InformationSectionChoices index={panel.index} />
            </>
          ) : panel?.kind === "edit" ? (
            <EventSectionEditorBusy.Provider value={setSectionBusy}>
              <EditorClose.Provider value={close}>
                <InformationSectionEditor
                  id={panel.section.id}
                  fallback={renderEditor(panel.section.editorId || panel.section.id)}
                />
              </EditorClose.Provider>
            </EventSectionEditorBusy.Provider>
          ) : null}
        </div>
        {panel?.kind === "edit" ? (
          <div className={styles.dialogFooter}>
            <button type="button" onClick={close} disabled={sectionBusy}>
              Done
            </button>
            <span>Save progress when you’re ready.</span>
          </div>
        ) : null}
      </dialog>
    </Builder.Provider>
  );
  return composition ? (
    <EventPageCompositionProvider {...composition}>{content}</EventPageCompositionProvider>
  ) : (
    content
  );
}

function CatalogItem({ section, index }: { section: EventSectionOption; index: number }) {
  const builder = useEventSectionBuilder();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: `catalog:${section.id}`,
  });
  if (!builder) return null;
  return (
    <div
      ref={setNodeRef}
      className={styles.catalogItem}
      style={{ opacity: isDragging ? 0.5 : undefined }}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={styles.grip}
        aria-label={`Drag ${section.label} onto page`}
      >
        <GripVertical size={18} />
      </button>
      <button
        type="button"
        className={styles.catalogAdd}
        onClick={() => builder.add(section, index)}
      >
        <Plus size={16} aria-hidden="true" />
        {section.label}
      </button>
    </div>
  );
}

export function EventSectionPalette() {
  const builder = useEventSectionBuilder();
  if (!builder) return null;
  const available = [
    ...builder.catalog,
    ...builder.entries.filter(
      (entry) =>
        builder.layout?.hidden.includes(entry.id) &&
        !builder.catalog.some((item) => item.id === entry.id),
    ),
  ].filter(
    (item) =>
      !builder.entries.some((entry) => entry.id === item.id) ||
      builder.layout?.hidden.includes(item.id),
  );
  const current = orderEventSections(builder.entries, builder.layout);
  return (
    <section className={styles.palette} aria-label="Page sections">
      <p>Add sections or use Place beside to share a row. Drag handles to reorder.</p>
      <div className={styles.paletteItems}>
        <span className={styles.paletteLabel} aria-hidden="true">
          Already on your page
        </span>
        <ol className={styles.sectionList} aria-label="Page section order">
          {current.map((section, index) => (
            <li key={section.id}>
              <span>{section.label}</span>
              <span className={styles.actions}>
                <button
                  type="button"
                  aria-label={`Edit ${section.label}`}
                  data-section-editor-id={section.id}
                  onClick={() => builder.edit(section)}
                >
                  <Pencil size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${section.label} up`}
                  disabled={index === 0}
                  onClick={() => builder.change({ type: "move", id: section.id, index: index - 1 })}
                >
                  <ArrowUp size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${section.label} down`}
                  disabled={index === current.length - 1}
                  onClick={() => builder.change({ type: "move", id: section.id, index: index + 1 })}
                >
                  <ArrowDown size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${section.label} section`}
                  onClick={() => builder.change({ type: "remove", id: section.id })}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ol>
        <span className={styles.paletteLabel}>Add to your page</span>
        {available.length > 0 && (
          <div className={styles.catalogGrid}>
            {available.map((section) => (
              <CatalogItem key={section.id} section={section} index={current.length} />
            ))}
          </div>
        )}
        <InformationSectionChoices index={current.length} />
      </div>
    </section>
  );
}

function InsertionPoint({ index }: { index: number }) {
  const builder = useEventSectionBuilder();
  const { setNodeRef, isOver } = useDroppable({ id: `insert:${index}` });
  return (
    <div ref={setNodeRef} className={`${styles.insertion} ${isOver ? styles.dropTarget : ""}`}>
      <button
        type="button"
        onClick={() => builder?.addAt(index)}
        aria-label={`Add section at position ${index + 1}`}
      >
        <Plus size={18} aria-hidden="true" />
        Add section
      </button>
    </div>
  );
}

function EditableSection({
  section,
  index,
  count,
}: {
  section: EventSectionEntry;
  index: number;
  count: number;
}) {
  const builder = useEventSectionBuilder();
  const paired = builder?.layout?.pairs?.some((pair) => pair.includes(section.id));
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section:${section.id}` });
  return (
    <div
      ref={setNodeRef}
      className={styles.section}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : undefined,
      }}
      data-editable-section={section.id}
    >
      <div className={styles.toolbar}>
        <span className={styles.sectionName}>
          <button
            type="button"
            className={styles.grip}
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${section.label}`}
          >
            <GripVertical size={18} />
          </button>
          <span className={styles.sectionLabel}>{section.label}</span>
        </span>
        <span className={styles.actions}>
          <button
            type="button"
            onClick={() => builder?.edit(section)}
            aria-label={`Edit ${section.label}`}
            title="Edit section"
          >
            <Pencil size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => builder?.change({ type: "move", id: section.id, index: index - 1 })}
            aria-label={`Move ${section.label} up`}
            title="Move up"
          >
            <ArrowUp size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={index === count - 1}
            onClick={() => builder?.change({ type: "move", id: section.id, index: index + 1 })}
            aria-label={`Move ${section.label} down`}
            title="Move down"
          >
            <ArrowDown size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => builder?.change({ type: "remove", id: section.id })}
            aria-label={`Remove ${section.label} section`}
            title="Remove section"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </span>
      </div>
      <div className={styles.layoutControls}>
        <button
          type="button"
          onClick={() => builder?.placeBeside(section)}
          aria-label={`Place another section beside ${section.label}`}
        >
          <Columns2 size={16} aria-hidden="true" />
          Place beside
        </button>
        {paired ? (
          <button
            type="button"
            onClick={() => builder?.change({ type: "unpair", id: section.id })}
            aria-label={`Move ${section.label} to its own row`}
          >
            Own row
          </button>
        ) : null}
      </div>
      {section.content || (
        <div className={styles.empty}>
          <p>Add your {section.label.toLowerCase()} content.</p>
          <button type="button" onClick={() => builder?.edit(section)}>
            <Pencil size={16} aria-hidden="true" />
            Edit section
          </button>
        </div>
      )}
    </div>
  );
}

export function EventSectionCanvas({
  sections,
  layout,
  className = "",
  cellClassName = "",
  itemClassName = "",
  renderSection,
  rowProps,
  visibleSectionIds,
}: {
  sections: EventSectionEntry[];
  layout?: EventSectionLayout;
  className?: string;
  cellClassName?: string;
  /** The visible row is the layout item, including while its editing tools are mounted. */
  itemClassName?: string;
  /** Apply authored section surfaces after native and added information sections are combined. */
  renderSection?: (section: EventSectionEntry, index: number) => ReactNode;
  rowProps?: (section: EventSectionEntry) => HTMLAttributes<HTMLDivElement>;
  /** Presentation-only filtering; retain all entries for editing, ordering and Undo. */
  visibleSectionIds?: readonly string[];
}) {
  const builder = useEventSectionBuilder();
  const composition = useEventPageComposition();
  sections = [
    ...sections,
    ...(composition?.value?.sections || [])
      .filter((section) => !sections.some((entry) => entry.id === section.id))
      .map((section) => ({
        id: section.id,
        label: section.title || "Information",
        content: (
          <section data-event-section={section.id} className={styles.information}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            <EventSectionExtrasContent value={section} />
            {section.map && <EventArrivalMap map={section.map} />}
          </section>
        ),
      })),
  ];
  const register = builder?.register;
  useEffect(() => {
    register?.(sections.map(({ id, label, editorId }) => ({ id, label, editorId })));
  }, [register, sections]);
  const currentLayout = builder ? builder.layout : layout;
  const candidates = builder
    ? [
        ...sections,
        ...builder.catalog
          .filter(
            (item) =>
              currentLayout?.added.includes(item.id) &&
              !sections.some((section) => section.id === item.id),
          )
          .map((item) => ({ ...item, content: null })),
      ]
    : sections;
  const rows = groupEventSectionRows(candidates, currentLayout);
  const ordered = rows.flat();
  if (
    !builder &&
    !currentLayout?.widths &&
    !currentLayout?.pairs?.length &&
    !rowProps &&
    !renderSection &&
    !itemClassName &&
    !visibleSectionIds &&
    !composition?.value?.layout
  )
    return (
      <div className={className} data-body-sections>
        {ordered.map((section) => (
          <Fragment key={section.id}>{section.content}</Fragment>
        ))}
      </div>
    );
  const content = rows.map((row) => {
    const index = ordered.findIndex((section) => section.id === row[0].id);
    const attributes = !builder ? rowProps?.(row[0]) : undefined;
    const visible =
      !visibleSectionIds || row.some((section) => visibleSectionIds.includes(section.id));
    const rowContent = (
      <div
        key={row[0].id}
        {...attributes}
        hidden={!visible || attributes?.hidden}
        style={{ ...attributes?.style, ...(!visible ? { display: "none" } : {}) }}
        className={`${styles.row} ${!builder ? itemClassName : ""} ${attributes?.className || ""}`}
        data-section-row={row.map((section) => section.id).join(" ")}
      >
        {row.map((section, offset) => (
          <div
            key={section.id}
            className={`${styles.cell} ${cellClassName}`}
            data-section-width={currentLayout?.widths?.[section.id] ?? 12}
            style={{ "--section-span": currentLayout?.widths?.[section.id] ?? 12 } as CSSProperties}
          >
            {builder ? (
              <EditableSection
                section={
                  renderSection && section.content
                    ? { ...section, content: renderSection(section, index + offset) }
                    : section
                }
                index={index + offset}
                count={ordered.length}
              />
            ) : renderSection ? (
              renderSection(section, index + offset)
            ) : (
              section.content
            )}
          </div>
        ))}
      </div>
    );
    return builder ? (
      <div
        key={row[0].id}
        className={`${styles.rowGroup} ${itemClassName}`}
        data-section-group
        hidden={!visible}
        style={!visible ? { display: "none" } : undefined}
      >
        <InsertionPoint index={index} />
        {rowContent}
      </div>
    ) : (
      rowContent
    );
  });
  return (
    <div
      className={`${className} ${styles.canvas}`}
      data-body-sections
      data-event-body-layout={composition?.value?.layout}
    >
      {builder ? (
        <SortableContext
          items={ordered.map((section) => `section:${section.id}`)}
          strategy={rectSortingStrategy}
        >
          {content}
          <InsertionPoint index={ordered.length} />
        </SortableContext>
      ) : (
        content
      )}
    </div>
  );
}
