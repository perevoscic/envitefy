"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { createContext, useContext, type ComponentProps } from "react";
import styles from "./signup-composer.module.css";

const HandleContext = createContext<ReturnType<typeof useSortable> | null>(null);

export function SignupDragHandle({ label }: { label: string }) {
  const sortable = useContext(HandleContext);
  if (!sortable) return null;
  return (
    <button
      type="button"
      ref={sortable.setActivatorNodeRef}
      {...sortable.attributes}
      {...sortable.listeners}
      className={styles.dragHandle}
      aria-label={`Drag ${label} to reorder`}
      title="Drag to move. Or press Space, use arrow keys, then Space to drop."
    >
      <GripVertical size={18} aria-hidden />
      <span>Move</span>
    </button>
  );
}

export default function SignupSortableSection({
  sectionId,
  children,
  ...props
}: ComponentProps<"section"> & { sectionId: string }) {
  const sortable = useSortable({ id: sectionId });
  return (
    <HandleContext.Provider value={sortable}>
      <section
        {...props}
        ref={sortable.setNodeRef}
        style={{
          ...props.style,
          transform: CSS.Translate.toString(sortable.transform),
          transition: sortable.transition,
        }}
        data-sorting={sortable.isDragging || undefined}
        data-sort-over={(sortable.isOver && !sortable.isDragging) || undefined}
      >
        {children}
      </section>
    </HandleContext.Provider>
  );
}
