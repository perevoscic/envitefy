"use client";

import { createContext, useContext } from "react";

// Inline section dialogs own their heading and Done action; embedded forms reuse it.
export const EventSectionEditorClose = createContext<(() => void) | null>(null);
export const useSectionEditorClose = () => useContext(EventSectionEditorClose);

// A photo batch must finish or be cancelled before the dialog can be completed.
export const EventSectionEditorBusy = createContext<((busy: boolean) => void) | null>(null);

// Section editors can put a control beside the dialog-owned heading.
export const EventSectionEditorHeaderTarget = createContext<HTMLElement | null>(null);
