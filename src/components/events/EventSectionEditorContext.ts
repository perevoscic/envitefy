"use client";

import { createContext, useContext, useEffect, useRef } from "react";

// Inline section dialogs own their heading and Done action; embedded forms reuse it.
export const EventSectionEditorClose = createContext<(() => void) | null>(null);
export const useSectionEditorClose = () => useContext(EventSectionEditorClose);

export type SectionEditorAction = { label: string; onClick: () => void; destructive?: boolean };
export const EventSectionEditorAction = createContext<((action: SectionEditorAction | null) => void) | null>(null);
export function useSectionEditorAction(label: string | null, onClick: () => void, destructive = false) {
  const setAction = useContext(EventSectionEditorAction);
  const handler = useRef(onClick);
  useEffect(() => { handler.current = onClick; }, [onClick]);
  useEffect(() => {
    setAction?.(label ? { label, onClick: () => handler.current(), destructive } : null);
    return () => setAction?.(null);
  }, [setAction, label, destructive]);
  return Boolean(setAction);
}

// A photo batch must finish or be cancelled before the dialog can be completed.
export const EventSectionEditorBusy = createContext<((busy: boolean) => void) | null>(null);

// Section editors can put a control beside the dialog-owned heading.
export const EventSectionEditorHeaderTarget = createContext<HTMLElement | null>(null);

// Nested editors identify the day/session currently being edited.
export const EventSectionEditorTitle = createContext<((title: string | null) => void) | null>(null);
export function useSectionEditorTitle(title: string) {
  const setTitle = useContext(EventSectionEditorTitle);
  useEffect(() => {
    setTitle?.(title);
    return () => setTitle?.(null);
  }, [setTitle, title]);
}
