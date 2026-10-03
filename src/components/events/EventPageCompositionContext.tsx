"use client";
import { createContext, useContext, type ReactNode } from "react";
import {
  normalizeEventPageComposition,
  type EventPageComposition,
} from "@/lib/event-page-composition";

export type EventPageCompositionRuntime = {
  value?: EventPageComposition;
  onChange?: (value: EventPageComposition | undefined) => void;
  renderEditor?: (id: string) => ReactNode;
};
const Context = createContext<EventPageCompositionRuntime | null>(null);
export const useEventPageComposition = () => useContext(Context);
export function EventPageCompositionProvider({
  value,
  onChange,
  renderEditor,
  children,
}: EventPageCompositionRuntime & { children: ReactNode }) {
  return (
    <Context.Provider
      value={{ value: normalizeEventPageComposition(value), onChange, renderEditor }}
    >
      {children}
    </Context.Provider>
  );
}
