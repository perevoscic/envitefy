"use client";

import { createContext } from "react";

/** Preview calendar actions use the same event-local fields as explicit saves. */
export const EventEditorCalendarContext = createContext<{
  date?: unknown;
  time?: unknown;
  endDate?: unknown;
  endTime?: unknown;
  timezone?: unknown;
} | null>(null);
