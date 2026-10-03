"use client";

import { createContext, useContext } from "react";

// Inline section dialogs own their heading and Done action; embedded forms reuse it.
export const EventSectionEditorClose = createContext<(() => void) | null>(null);
export const useSectionEditorClose = () => useContext(EventSectionEditorClose);
