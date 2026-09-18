"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  copySignupSection,
  moveSignupItem,
  placeSignupSection,
  signupSectionHasResponses,
  type ComposerDrag,
} from "@/lib/signup-composer";
import type { SignupForm, SignupFormSection, SignupFormSlot } from "@/types/signup";
import { createSignupSlot, generateSignupId } from "@/utils/signup";
import styles from "./signup-composer.module.css";
import SignupSortableSection, { SignupDragHandle } from "./SignupSortableSection";
import SignupSectionRules from "./SignupSectionRules";

type Props = {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
  drag: ComposerDrag | null;
  onDrag: (drag: ComposerDrag | null) => void;
  onAdd: () => void;
};

export default function SignupContentEditor({ form, onChange, drag, onDrag, onAdd }: Props) {
  const [over, setOver] = useState<string | null>(null);
  const [sorting, setSorting] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [notice, setNotice] = useState("");
  const [undo, setUndo] = useState<{
    label: string;
    restore: (current: SignupForm) => SignupForm;
  } | null>(null);
  const updateSection = (section: SignupFormSection) =>
    onChange({
      ...form,
      sections: form.sections.map((item) => (item.id === section.id ? section : item)),
    });
  const updateSlot = (section: SignupFormSection, slot: SignupFormSlot) =>
    updateSection({
      ...section,
      slots: section.slots.map((item) => (item.id === slot.id ? slot : item)),
    });
  const move = (index: number, direction: -1 | 1) => {
    onChange({ ...form, sections: moveSignupItem(form.sections, index, index + direction) });
    setNotice(`Section moved ${direction < 0 ? "up" : "down"}.`);
  };
  const dropProps = (beforeId?: string) => ({
    onDragOver: (event: React.DragEvent) => {
      if (!drag) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = drag.kind === "block" ? "copy" : "move";
      setOver(beforeId || "end");
    },
    onDrop: (event: React.DragEvent) => {
      if (!drag) return;
      event.preventDefault();
      event.stopPropagation();
      onChange(placeSignupSection(form, drag, beforeId));
      onDrag(null);
      setOver(null);
      setNotice("Section placed. Your changes have not been saved yet.");
    },
  });
  return (
    <div className={styles.content}>
      <div className={styles.sectionHeading}>
        <div>
          <h2>Your form sections</h2>
          <p>Drag the Move handle to arrange sections, or use the arrow buttons.</p>
        </div>
        <button type="button" onClick={onAdd}>
          + Add section
        </button>
      </div>
      <p role="status" className={styles.status}>
        {notice}
      </p>
      <details className={styles.headingOptions}>
        <summary>Form heading & introduction (optional)</summary>
        <p className={styles.hint}>Leave these blank to show just your sections.</p>
        <label className={styles.field}>
          Form heading
          <input
            value={form.boardTitle ?? "Sign-up board"}
            placeholder="Optional"
            onChange={(e) => onChange({ ...form, boardTitle: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          Introduction
          <textarea
            rows={2}
            value={
              form.boardDescription ??
              "Choose what you can bring or how you can help. Every contribution counts."
            }
            placeholder="Optional"
            onChange={(e) => onChange({ ...form, boardDescription: e.target.value })}
          />
        </label>
      </details>
      {undo && (
        <div className={styles.undo} role="status">
          {undo.label} removed.{" "}
          <button
            type="button"
            onClick={() => {
              onChange(undo.restore(form));
              setUndo(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setSorting(String(active.id))}
        onDragCancel={() => setSorting(null)}
        onDragEnd={({ active, over: target }) => {
          setSorting(null);
          if (!target || active.id === target.id) return;
          const from = form.sections.findIndex((section) => section.id === active.id);
          const to = form.sections.findIndex((section) => section.id === target.id);
          onChange({ ...form, sections: moveSignupItem(form.sections, from, to) });
          setNotice("Section moved. Your changes have not been saved yet.");
        }}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) =>
              `Picked up ${form.sections.find((section) => section.id === active.id)?.title || "section"}.`,
            onDragOver: ({ active, over }) =>
              over
                ? `${form.sections.find((section) => section.id === active.id)?.title || "Section"}, position ${form.sections.findIndex((section) => section.id === over.id) + 1} of ${form.sections.length}.`
                : "Move over another section to place it.",
            onDragEnd: ({ active, over }) =>
              `${form.sections.find((section) => section.id === active.id)?.title || "Section"} ${over ? `placed at position ${form.sections.findIndex((section) => section.id === over.id) + 1}` : "returned to its original position"}.`,
            onDragCancel: () => "Move cancelled. Section order unchanged.",
          },
          screenReaderInstructions: {
            draggable:
              "Press Space to pick up a section, arrow keys to move, Space to drop, or Escape to cancel. Move up and Move down buttons are also available.",
          },
        }}
      >
        <SortableContext
          items={form.sections.map((section) => section.id)}
          strategy={verticalListSortingStrategy}
        >
          <div id="signup-slots" tabIndex={-1}>
            {form.sections.map((section, index) => {
              const protectedSection = signupSectionHasResponses(form, section.id);
              return (
                <SignupSortableSection
                  key={section.id}
                  sectionId={section.id}
                  id={`signup-section-${section.id}`}
                  tabIndex={-1}
                  className={styles.section}
                  data-drop-active={drag && over === section.id ? "true" : undefined}
                  {...dropProps(section.id)}
                >
                  <div className={styles.sectionToolbar}>
                    <SignupDragHandle label={section.title || "section"} />
                    <span>
                      {section.kind === "info"
                        ? "Text section"
                        : `Signup section · ${section.slots.length} slots`}
                    </span>
                    <div className={styles.tools}>
                      <button
                        type="button"
                        aria-label={`Move ${section.title || "section"} up`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${section.title || "section"} down`}
                        disabled={index === form.sections.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label={`Duplicate ${section.title || "section"}`}
                        onClick={() => {
                          const sections = [...form.sections];
                          sections.splice(index + 1, 0, copySignupSection(section));
                          onChange({ ...form, sections });
                        }}
                      >
                        <Copy size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        disabled={protectedSection}
                        title={
                          protectedSection
                            ? "This section has signups and must be retained."
                            : "Remove section"
                        }
                        onClick={() => {
                          if (signupSectionHasResponses(form, section.id)) return;
                          onChange({
                            ...form,
                            sections: form.sections.filter((item) => item.id !== section.id),
                          });
                          setUndo({
                            label: section.title || "Section",
                            restore: (current) => {
                              const sections = [...current.sections];
                              sections.splice(Math.min(index, sections.length), 0, section);
                              return { ...current, sections };
                            },
                          });
                        }}
                      >
                        <Trash2 size={15} aria-hidden />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                  {protectedSection && (
                    <p className={styles.hint}>
                      Has signups. You can edit or move this section; existing places are protected.
                    </p>
                  )}
                  <label className={styles.field}>
                    Section title
                    <input
                      value={section.title}
                      placeholder="Give this section a name"
                      onChange={(e) => updateSection({ ...section, title: e.target.value })}
                    />
                  </label>
                  <label className={styles.field}>
                    {section.kind === "info" ? "Information for guests" : "Instructions (optional)"}
                    <textarea
                      rows={2}
                      value={section.description || ""}
                      placeholder="What should guests know?"
                      onChange={(e) => updateSection({ ...section, description: e.target.value })}
                    />
                  </label>
                  {section.kind !== "info" && (
                    <>
                      <SignupSectionRules section={section} onChange={updateSection} />
                      <div className={styles.slotList}>
                        {section.slots.map((slot, slotIndex) => {
                          const protectedSlot = signupSectionHasResponses(
                            form,
                            section.id,
                            slot.id,
                          );
                          return (
                            <div key={slot.id} className={styles.slot}>
                              <div className={styles.slotRow}>
                                <label className={styles.field}>
                                  What can someone sign up for?
                                  <input
                                    value={slot.label}
                                    placeholder="e.g. Bring dessert or help at the welcome desk"
                                    onChange={(e) =>
                                      updateSlot(section, { ...slot, label: e.target.value })
                                    }
                                  />
                                </label>
                                <label className={styles.field}>
                                  Places / quantity
                                  <input
                                    type="number"
                                    min={1}
                                    max={999}
                                    placeholder="Unlimited"
                                    value={slot.capacity ?? ""}
                                    onChange={(e) =>
                                      updateSlot(section, {
                                        ...slot,
                                        capacity:
                                          e.target.value === "" ? null : Number(e.target.value),
                                      })
                                    }
                                  />
                                </label>
                              </div>
                              <div className={styles.slotActions}>
                                <details open={section.purpose === "times" || undefined}>
                                  <summary>Time & notes</summary>
                                  <div className={styles.slotRow}>
                                    <label className={styles.field}>
                                      Starts at
                                      <input
                                        type="time"
                                        value={slot.startTime || ""}
                                        onChange={(e) =>
                                          updateSlot(section, {
                                            ...slot,
                                            startTime: e.target.value,
                                          })
                                        }
                                      />
                                    </label>
                                    <label className={styles.field}>
                                      Ends at
                                      <input
                                        type="time"
                                        value={slot.endTime || ""}
                                        onChange={(e) =>
                                          updateSlot(section, { ...slot, endTime: e.target.value })
                                        }
                                      />
                                    </label>
                                  </div>
                                  <label className={styles.field}>
                                    Notes
                                    <textarea
                                      rows={2}
                                      value={slot.notes || ""}
                                      onChange={(e) =>
                                        updateSlot(section, { ...slot, notes: e.target.value })
                                      }
                                    />
                                  </label>
                                </details>
                                <div className={styles.tools}>
                                  <button
                                    type="button"
                                    aria-label={`Move ${slot.label || "slot"} up`}
                                    disabled={slotIndex === 0}
                                    onClick={() =>
                                      updateSection({
                                        ...section,
                                        slots: moveSignupItem(
                                          section.slots,
                                          slotIndex,
                                          slotIndex - 1,
                                        ),
                                      })
                                    }
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Move ${slot.label || "slot"} down`}
                                    disabled={slotIndex === section.slots.length - 1}
                                    onClick={() =>
                                      updateSection({
                                        ...section,
                                        slots: moveSignupItem(
                                          section.slots,
                                          slotIndex,
                                          slotIndex + 1,
                                        ),
                                      })
                                    }
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Duplicate ${slot.label || "slot"}`}
                                    onClick={() => {
                                      const slots = [...section.slots];
                                      slots.splice(slotIndex + 1, 0, {
                                        ...slot,
                                        id: generateSignupId(),
                                      });
                                      updateSection({ ...section, slots });
                                    }}
                                  >
                                    <Copy size={15} aria-hidden />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={protectedSlot}
                                    title={protectedSlot ? "This slot has signups." : "Remove slot"}
                                    aria-label={`Remove ${slot.label || "slot"}`}
                                    onClick={() => {
                                      if (signupSectionHasResponses(form, section.id, slot.id))
                                        return;
                                      updateSection({
                                        ...section,
                                        slots: section.slots.filter((item) => item.id !== slot.id),
                                      });
                                      setUndo({
                                        label: slot.label || "Slot",
                                        restore: (current) => ({
                                          ...current,
                                          sections: current.sections.map((item) => {
                                            if (item.id !== section.id) return item;
                                            const slots = [...item.slots];
                                            slots.splice(
                                              Math.min(slotIndex, slots.length),
                                              0,
                                              slot,
                                            );
                                            return { ...item, slots };
                                          }),
                                        }),
                                      });
                                    }}
                                  >
                                    <Trash2 size={15} aria-hidden />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        className={styles.addRow}
                        onClick={() =>
                          updateSection({
                            ...section,
                            slots: [...section.slots, createSignupSlot()],
                          })
                        }
                      >
                        + Add slot
                      </button>
                    </>
                  )}
                </SignupSortableSection>
              );
            })}
            <div
              className={styles.dropZone}
              data-drop-active={drag && over === "end" ? "true" : undefined}
              {...dropProps()}
            >
              {!form.sections.length && (
                <>
                  <h3>What are people signing up for?</h3>
                  <p>Your theme is ready. Add places, jobs, items, or times to start your form.</p>
                </>
              )}
              <button type="button" onClick={onAdd}>
                + Add section
              </button>
              <span className={styles.desktopHint}> or drag a section here</span>
            </div>
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {sorting ? (
            <div className={styles.dragOverlay}>
              <GripVertical size={18} aria-hidden />
              {form.sections.find((section) => section.id === sorting)?.title || "Section"}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <section className={styles.section} id="signup-questions" tabIndex={-1}>
        <h2>Questions for participants</h2>
        <p className={styles.hint}>
          Optional. Guests answer these after choosing their slots. Name and contact details are
          collected separately.
        </p>
        {form.questions.map((question, index) => (
          <div key={question.id} className={styles.slot}>
            <label className={styles.field}>
              Question
              <input
                value={question.prompt}
                placeholder="e.g. Any dietary requirements?"
                onChange={(e) =>
                  onChange({
                    ...form,
                    questions: form.questions.map((q) =>
                      q.id === question.id ? { ...q, prompt: e.target.value } : q,
                    ),
                  })
                }
              />
            </label>
            <div className={styles.sectionToolbar}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={!!question.required}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      questions: form.questions.map((q) =>
                        q.id === question.id ? { ...q, required: e.target.checked } : q,
                      ),
                    })
                  }
                />
                Required
              </label>
              <label className={styles.field}>
                Answer length
                <select
                  value={question.multiline ? "long" : "short"}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      questions: form.questions.map((q) =>
                        q.id === question.id ? { ...q, multiline: e.target.value === "long" } : q,
                      ),
                    })
                  }
                >
                  <option value="short">Short answer</option>
                  <option value="long">Long answer</option>
                </select>
              </label>
              <div className={styles.tools}>
                <button
                  type="button"
                  aria-label="Move question up"
                  disabled={index === 0}
                  onClick={() =>
                    onChange({
                      ...form,
                      questions: moveSignupItem(form.questions, index, index - 1),
                    })
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move question down"
                  disabled={index === form.questions.length - 1}
                  onClick={() =>
                    onChange({
                      ...form,
                      questions: moveSignupItem(form.questions, index, index + 1),
                    })
                  }
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={form.responses.some((r) =>
                    r.answers?.some((answer) => answer.questionId === question.id),
                  )}
                  onClick={() => {
                    onChange({
                      ...form,
                      questions: form.questions.filter((q) => q.id !== question.id),
                    });
                    setUndo({
                      label: "Question",
                      restore: (current) => {
                        const questions = [...current.questions];
                        questions.splice(Math.min(index, questions.length), 0, question);
                        return { ...current, questions };
                      },
                    });
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...form,
              questions: [
                ...form.questions,
                { id: generateSignupId(), prompt: "", required: false, multiline: false },
              ],
            })
          }
        >
          + Add question
        </button>
      </section>
    </div>
  );
}
