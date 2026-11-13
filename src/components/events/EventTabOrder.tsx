"use client";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type KeyboardCoordinateGetter,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./event-section-navigation.module.css";

const restrictToHorizontalAxis: Modifier = ({ transform }) => ({
  ...transform,
  y: 0,
});

const horizontalKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  if (event.code === "ArrowUp" || event.code === "ArrowDown") {
    event.preventDefault();
    return undefined;
  }
  return sortableKeyboardCoordinates(event, args);
};

export function EventTabOrder({
  ids,
  onMove,
  children,
  enabled,
}: {
  ids: string[];
  onMove: (id: string, index: number) => void;
  children: ReactNode;
  enabled: boolean;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: horizontalKeyboardCoordinates }),
  );
  if (!enabled) return <>{children}</>;
  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToHorizontalAxis]}
      autoScroll={{
        canScroll: (element) =>
          element.scrollWidth > element.clientWidth &&
          element.scrollHeight <= element.clientHeight,
      }}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        const index = ids.indexOf(String(over.id));
        if (index >= 0) onMove(String(active.id), index);
      }}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Press space to pick up a tab. Use left and right arrows to move it, space to drop, or Escape to cancel.",
        },
      }}
    >
      <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export function EventSortableTab({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className={styles.sortableTab}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
      }}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={styles.tabGrip}
        data-tab-drag-handle
        aria-label={`Drag ${label} tab`}
        title="Drag tab left or right"
      >
        <GripVertical size={16} aria-hidden="true" />
      </button>
      {children}
    </div>
  );
}
