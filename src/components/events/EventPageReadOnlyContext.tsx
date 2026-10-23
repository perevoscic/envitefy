"use client";

import { createContext, type ReactNode, useContext } from "react";

const EventPageReadOnlyContext = createContext(false);

/** The clean page keeps its mounted editor state, while exposing guest-facing controls only. */
export function EventPageReadOnlyProvider({
  readOnly,
  children,
}: {
  readOnly: boolean;
  children: ReactNode;
}) {
  const parentReadOnly = useContext(EventPageReadOnlyContext);
  return (
    <EventPageReadOnlyContext.Provider value={parentReadOnly || readOnly}>
      {children}
    </EventPageReadOnlyContext.Provider>
  );
}

export const useEventPageReadOnly = () => useContext(EventPageReadOnlyContext);
