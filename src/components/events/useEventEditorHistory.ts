"use client";

import { useEffect, useRef, useState } from "react";

/** One focused text edit is one step; separate controls remain separate steps. */
export function useEventEditorHistory(snapshot: object, ready: boolean) {
  const serialized = JSON.stringify(snapshot);
  const history = useRef({ baseline: serialized, current: serialized, steps: [] as string[], group: -1 });
  const interaction = useRef({ started: false, group: 0, field: null as EventTarget | null });
  const wasReady = useRef(false);
  const [, refresh] = useState(0);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const edit = (event: Event) => {
      const state = interaction.current;
      state.started = true;
      if (event.type === "input" || event.type === "change") {
        if (state.field !== event.target) state.group++;
        state.field = event.target;
      } else if (event.type === "pointerdown" || event.type === "focusout" ||
        (event instanceof KeyboardEvent && ["Enter", " "].includes(event.key) &&
          !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement))) {
        state.group++;
        state.field = null;
      }
    };
    const events = ["input", "change", "pointerdown", "keydown", "focusout"];
    events.forEach(name => document.addEventListener(name, edit, true));
    return () => events.forEach(name => document.removeEventListener(name, edit, true));
  }, []);
  // Keep hydration/background initialization out of the host's undo history.
  const state = history.current;
  if (!ready || !wasReady.current || !interaction.current.started) {
    state.baseline = serialized;
    state.current = serialized;
    state.steps = [];
  } else if (serialized !== state.current) {
    if (state.group !== interaction.current.group) {
      state.steps.push(state.current);
      if (state.steps.length > 100) state.steps.shift();
    }
    state.group = interaction.current.group;
    state.current = serialized;
  }
  wasReady.current = ready;
  const restore = (value: string) => {
    state.current = value;
    state.group = -1;
    interaction.current.group++;
    refresh(count => count + 1);
    return JSON.parse(value) as object;
  };
  return {
    canUndo: ready && state.steps.length > 0 && state.current !== state.baseline,
    undo: () => restore(state.steps.pop() ?? state.baseline),
    reset: () => {
      state.steps = [];
      return restore(state.baseline);
    },
    baseline: () => JSON.parse(state.baseline) as object,
    markSaved: (saved: object) => {
      const value = JSON.stringify(saved);
      const index = state.steps.lastIndexOf(value);
      state.steps = state.current === value ? [] : index >= 0 ? state.steps.slice(index) : [value];
      state.baseline = value;
      state.group = -1;
      refresh(count => count + 1);
    },
  };
}
