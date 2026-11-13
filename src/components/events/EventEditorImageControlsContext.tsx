"use client";

import { createContext, useContext } from "react";

/** Keeps the existing hero picker inside Event image settings on every screen size. */
export const EventEditorImageControlsContext = createContext<HTMLDivElement | null>(null);

export const useEventEditorImageControls = () => useContext(EventEditorImageControlsContext);
