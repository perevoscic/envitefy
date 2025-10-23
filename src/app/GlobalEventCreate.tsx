"use client";

import { useEffect, useState } from "react";
import EventCreateModal from "@/components/EventCreateModal";

export default function GlobalEventCreate() {
  const [open, setOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const openFn = (d?: unknown) => {
      try {
        // Ensure Smart Signup modal is closed before opening this one
        (window as any).__closeSmartSignup?.();
        window.dispatchEvent?.(new Event("closeSmartSignup"));
      } catch {}
      try {
        if (d instanceof Date) {
          setDefaultDate(new Date(d));
        } else if (typeof d === "string" || typeof d === "number") {
          const parsed = new Date(d as any);
          setDefaultDate(isNaN(parsed.getTime()) ? new Date() : parsed);
        } else {
          setDefaultDate(new Date());
        }
      } catch {
        setDefaultDate(new Date());
      }
      setOpen(true);
    };
    (window as any).__openCreateEvent = openFn;
    // Expose a global closer so other modals can close this one
    (window as any).__closeCreateEvent = () => {
      try {
        setOpen(false);
      } catch {}
    };
    try {
      window.addEventListener("openCreateEvent", ((e: Event) =>
        openFn((e as CustomEvent).detail)) as EventListener);
      window.addEventListener("closeCreateEvent", (() =>
        (window as any).__closeCreateEvent?.()) as EventListener);
    } catch {}
    return () => {
      try {
        delete (window as any).__openCreateEvent;
        delete (window as any).__closeCreateEvent;
        window.removeEventListener("openCreateEvent", ((e: Event) =>
          openFn((e as CustomEvent).detail)) as EventListener);
        window.removeEventListener("closeCreateEvent", (() =>
          (window as any).__closeCreateEvent?.()) as EventListener);
      } catch {}
    };
  }, []);

  return (
    <EventCreateModal
      open={open}
      onClose={() => setOpen(false)}
      defaultDate={defaultDate}
    />
  );
}
