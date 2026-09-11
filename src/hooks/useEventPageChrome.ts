import { useLayoutEffect, useRef } from "react";
import { type EventEditAction, useSidebar } from "@/app/sidebar-context";
import { registerEventPageColor } from "@/lib/event-page-chrome";

export function useEventPageColor(color?: string | null, enabled = true) {
  const registration = useRef<ReturnType<typeof registerEventPageColor> | null>(null);
  const latestColor = useRef(color);
  latestColor.current = color;
  useLayoutEffect(() => {
    if (!enabled) return;
    const current = registerEventPageColor(document.documentElement, latestColor.current);
    registration.current = current;
    return () => {
      current.dispose();
      registration.current = null;
    };
  }, [enabled]);
  useLayoutEffect(() => registration.current?.update(color), [color]);
}

export function useEventTopbarEdit(action: EventEditAction | null) {
  const { setEventEditAction } = useSidebar();
  useLayoutEffect(() => {
    if (!action) return;
    setEventEditAction(action);
    return () => setEventEditAction((current) => current === action ? null : current);
  }, [action, setEventEditAction]);
}
