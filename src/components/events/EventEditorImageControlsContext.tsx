"use client";

import { createContext, useContext } from "react";

/** Moves the existing hero picker into settings while the phone canvas is hidden. */
export const EventEditorImageControlsContext = createContext<HTMLDivElement | null>(null);

export const useEventEditorImageControls = () => useContext(EventEditorImageControlsContext);
