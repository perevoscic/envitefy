"use client";

import { createContext, useContext, useEffect, useId, useRef } from "react";

export type SectionTextField = {
  id: string;
  label: string;
  value?: string;
  fallback: string;
  maxLength: number;
  multiline: boolean;
  onChange: (value: string | undefined) => void;
};
export const EventSectionTextScope = createContext<{
  register: (field: SectionTextField) => void;
  unregister: (id: string) => void;
} | null>(null);

/** Canvas section wording uses the same values and callbacks in its side panel. */
export function useSectionTextField(field: Omit<SectionTextField, "id" | "onChange"> & {
  onChange?: SectionTextField["onChange"];
}, readOnly: boolean) {
  const scope = useContext(EventSectionTextScope);
  const id = useId();
  const latest = useRef(field.onChange);
  latest.current = field.onChange;
  const enabled = Boolean(scope && field.onChange && !readOnly);
  useEffect(() => {
    if (!scope || !enabled) return;
    scope.register({ ...field, id, onChange: value => latest.current?.(value) });
  }, [scope, enabled, id, field.label, field.value, field.fallback, field.maxLength, field.multiline]);
  useEffect(() => {
    if (!scope || !enabled) return;
    return () => scope.unregister(id);
  }, [scope, enabled, id]);
  return enabled;
}
