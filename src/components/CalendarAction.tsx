"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CalendarPlus, X } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { useCalendarPreference } from "@/hooks/useCalendarPreference";
import {
  CALENDAR_PROVIDER_NAMES,
  type CalendarProvider,
  calendarActionLabel,
  calendarProviderHref,
  type EventCalendarLinks,
} from "@/lib/calendar-preference";
import { openAppleCalendarIcs } from "@/utils/calendar-open";

type CalendarActionOptions = {
  links?: EventCalendarLinks | null;
  onChoose?: (provider: CalendarProvider) => void;
};

export function useCalendarAction({ links, onChoose }: CalendarActionOptions) {
  const preference = useCalendarPreference();
  const [isOpen, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const previousOpen = useRef<{ provider: CalendarProvider; time: number } | null>(null);
  const label = calendarActionLabel(preference.provider);

  const openProvider = (provider: CalendarProvider) => {
    const now = Date.now();
    if (previousOpen.current?.provider === provider && now - previousOpen.current.time < 1200)
      return;
    previousOpen.current = { provider, time: now };
    if (onChoose) {
      onChoose(provider);
      return;
    }
    if (!links) return;
    const href = calendarProviderHref(links, provider);
    if (provider === "apple") openAppleCalendarIcs(href);
    else window.open(href, "_blank", "noopener,noreferrer");
  };
  const open = () => {
    if (!links && !onChoose) return;
    if (preference.provider) {
      openProvider(preference.provider);
      return;
    }
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setRemember(false);
    setOpen(true);
  };
  const select = (provider: CalendarProvider) => {
    setOpen(false);
    // Keep this synchronous so the browser permits the calendar window / Apple handoff.
    openProvider(provider);
    if (remember && preference.canRemember(provider)) void preference.remember(provider);
  };
  const dialog = (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[13000] bg-black/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[13001] max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#ddd4f8] bg-white p-5 text-[#2f2550] shadow-2xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <Dialog.Title className="pr-11 text-lg font-semibold">Add to calendar</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-[#6f5ba3]">
            Choose where to add this event.
          </Dialog.Description>
          <Dialog.Close
            className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-[#f7f2ff]"
            aria-label="Close calendar options"
          >
            <X className="size-4" aria-hidden="true" />
          </Dialog.Close>
          <div className="mt-5 space-y-2">
            {(["google", "apple", "microsoft"] as const).map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => select(provider)}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-[#ddd4f8] px-4 py-3 text-left text-sm font-medium hover:bg-[#f7f2ff] focus-visible:outline-2 focus-visible:outline-violet-600"
              >
                <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
                {CALENDAR_PROVIDER_NAMES[provider]}
              </button>
            ))}
          </div>
          {(["google", "apple", "microsoft"] as const).some(preference.canRemember) ? (
            <label className="mt-4 flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="size-4 accent-violet-600"
              />
              {preference.signedIn
                ? "Remember a connected provider as my default calendar"
                : "Remember my default calendar"}
            </label>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
  return { label, open, isOpen, hasDefault: Boolean(preference.provider), dialog };
}

export default function CalendarAction({
  links,
  onChoose,
  className,
  labelClassName,
  children,
}: CalendarActionOptions & {
  className?: string;
  labelClassName?: string;
  children?: (label: string) => ReactNode;
}) {
  const calendar = useCalendarAction({ links, onChoose });
  return (
    <>
      <button
        type="button"
        className={
          className ||
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-current/20 px-4 py-2 text-sm font-medium"
        }
        onClick={calendar.open}
        aria-label={calendar.label}
        title={calendar.label}
        aria-haspopup={calendar.hasDefault ? undefined : "dialog"}
        aria-expanded={calendar.hasDefault ? undefined : calendar.isOpen}
      >
        {children ? (
          children(calendar.label)
        ) : (
          <>
            <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className={labelClassName}>{calendar.label}</span>
          </>
        )}
      </button>
      {calendar.dialog}
    </>
  );
}
