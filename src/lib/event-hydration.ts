"use client";

import { createContext, useContext } from "react";

/** Null outside the signed-in shell. False until the first event list read settles. */
export const EventHydrationContext = createContext<boolean | null>(null);

export function useOptionalEventHydration(): boolean | null {
  return useContext(EventHydrationContext);
}
