"use client";

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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
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
} from "react";
import {
  changeEventSectionLayout,
  orderEventSections,
  type EventSectionLayout,
  type EventSectionChange,
} from "@/lib/event-section-layout";
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
};
const Builder = createContext<BuilderContext | null>(null);
const EditorClose = createContext<(() => void) | null>(null);
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
export const useSectionEditorClose = () => useContext(EditorClose);

export function EventSectionsReadOnly({ children }: { children: ReactNode }) {
  return <Builder.Provider value={null}>{children}</Builder.Provider>;
}

export function EventSectionBuilderProvider({
  layout,
  onChange,
  catalog,
  renderEditor,
  children,
}: {
  layout?: EventSectionLayout;
  onChange: (layout: EventSectionLayout | undefined) => void;
  catalog: readonly EventSectionOption[];
  renderEditor: (id: string) => ReactNode;
  children: ReactNode;
}) {
  const [entries, setEntries] = useState<EventSectionOption[]>([]);
  const [panel, setPanel] = useState<
    { kind: "add"; index: number } | { kind: "edit"; section: EventSectionOption } | null
  >(null);
  const [dragLabel, setDragLabel] = useState("");
  const [notice, setNotice] = useState("");
  const [undo, setUndo] = useState<Array<EventSectionLayout | undefined>>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const focusReturn = useRef<HTMLElement | null>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sectionKeyboardCoordinates }),
  );
  const register = useCallback((next: EventSectionOption[]) => {
    setEntries((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
  }, []);
  const close = useCallback(() => setPanel(null), []);
  useEffect(() => {
    const element = dialog.current;
    if (panel && element && !element.open) {
      focusReturn.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
    } else if (!panel && element?.open) {
      element.close();
      if (focusReturn.current?.isConnected) focusReturn.current.focus({ preventScroll: true });
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
      setUndo((previous) => [...previous.slice(-19), layout]);
      onChange(
        changeEventSectionLayout(
          layout,
          visible.map((entry) => entry.id),
          action,
        ),
      );
      const label =
        [...catalog, ...entries].find((item) => item.id === action.id)?.label || "Section";
      setNotice(
        `${label} ${action.type === "remove" ? "removed from page" : action.type === "add" ? "added" : "moved"}.`,
      );
      if (action.type === "remove")
        requestAnimationFrame(() => undoButton.current?.focus({ preventScroll: true }));
    },
    [layout, visible, onChange, catalog, entries],
  );
  const edit = useCallback(
    (section: EventSectionOption) => setPanel({ kind: "edit", section }),
    [],
  );
  const addAt = useCallback((index: number) => setPanel({ kind: "add", index }), []);
  const add = useCallback(
    (section: EventSectionOption, index: number) => {
      if (!visible.some((item) => item.id === section.id))
        change({ type: "add", id: section.id, index });
      edit(section);
    },
    [visible, change, edit],
  );
  const value = useMemo(
    () => ({ layout, catalog, entries, register, change, edit, addAt, add }),
    [layout, catalog, entries, register, change, edit, addAt, add],
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
  return (
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
          <span role="status">{notice}</span>
          {undo.length ? (
            <button
              ref={undoButton}
              type="button"
              onClick={() => {
                const previous = undo[undo.length - 1];
                setUndo((history) => history.slice(0, -1));
                onChange(previous);
                setNotice("Section change undone.");
              }}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={titleId}
        onCancel={close}
        onClose={close}
      >
        <div className={styles.dialogHeader}>
          <h2 id={titleId}>{panel?.kind === "edit" ? panel.section.label : "Add section"}</h2>
          <button type="button" onClick={close} aria-label="Close section panel">
            <X size={20} />
          </button>
        </div>
        <div className={styles.dialogBody}>
          {panel?.kind === "add" ? (
            <div className={styles.choices}>
              {catalog.map((section) => (
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
          ) : panel?.kind === "edit" ? (
            <EditorClose.Provider value={close}>
              {renderEditor(panel.section.editorId || panel.section.id)}
            </EditorClose.Provider>
          ) : null}
        </div>
        {panel?.kind === "edit" ? (
          <div className={styles.dialogFooter}>
            <button type="button" onClick={close}>
              Done
            </button>
            <span>Save progress when you’re ready.</span>
          </div>
        ) : null}
      </dialog>
    </Builder.Provider>
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
  const available = builder.catalog.filter(
    (item) =>
      !builder.entries.some((entry) => entry.id === item.id) ||
      builder.layout?.hidden.includes(item.id),
  );
  return (
    <section className={styles.palette} aria-label="Page sections">
      <h3>Page sections</h3>
      <p>Use + on the page to add a section. Drag the handle to choose its position.</p>
      <button
        type="button"
        className={styles.addButton}
        onClick={() => builder.addAt(builder.entries.length)}
      >
        <Plus size={18} aria-hidden="true" />
        Add section
      </button>
      <div className={styles.paletteItems}>
        {available.map((section) => (
          <CatalogItem key={section.id} section={section} index={builder.entries.length} />
        ))}
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
}: {
  sections: EventSectionEntry[];
  layout?: EventSectionLayout;
  className?: string;
}) {
  const builder = useEventSectionBuilder();
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
  const ordered = orderEventSections(candidates, currentLayout);
  if (!builder)
    return (
      <div className={className}>
        {ordered.map((section) => (
          <Fragment key={section.id}>{section.content}</Fragment>
        ))}
      </div>
    );
  return (
    <div className={className}>
      <SortableContext
        items={ordered.map((section) => `section:${section.id}`)}
        strategy={verticalListSortingStrategy}
      >
        {ordered.map((section, index) => (
          <Fragment key={section.id}>
            <InsertionPoint index={index} />
            <EditableSection section={section} index={index} count={ordered.length} />
          </Fragment>
        ))}
        <InsertionPoint index={ordered.length} />
      </SortableContext>
    </div>
  );
}
