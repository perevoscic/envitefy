"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Calendar, CalendarPlus, X } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { useCalendarPreference } from "@/hooks/useCalendarPreference";
import {
  CALENDAR_PROVIDER_NAMES,
  type CalendarProvider,
  calendarActionLabel,
  type EventCalendarLinks,
} from "@/lib/calendar-preference";
import { openCalendarProvider } from "@/utils/calendar-open";
import { ensureReadableTextColor, mixHexColors } from "@/lib/scanned-invite-palette";

type ScanCalendarTheme = {
  primary: string;
  secondary: string;
  text: string;
  apple?: string;
  title?: string;
};

type CalendarActionOptions = {
  links?: EventCalendarLinks | null;
};

export function useCalendarAction({ links, onShowChooser, scanTheme }: CalendarActionOptions & {
  onShowChooser?: () => void;
  scanTheme?: ScanCalendarTheme;
}) {
  const preference = useCalendarPreference();
  const [isOpen, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);
  const [nativeAttempt, setNativeAttempt] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const previousOpen = useRef<{ provider: CalendarProvider; time: number } | null>(null);
  const label = calendarActionLabel(preference.provider);

  const openProvider = (provider: CalendarProvider): boolean => {
    const now = Date.now();
    if (previousOpen.current?.provider === provider && now - previousOpen.current.time < 1200)
      return nativeAttempt;
    previousOpen.current = { provider, time: now };
    setNativeAttempt(false);
    if (!links) return false;
    const attempted = openCalendarProvider(links, provider);
    setNativeAttempt(attempted);
    return attempted;
  };
  const open = () => {
    if (!links) return;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (preference.provider) {
      if (openProvider(preference.provider)) {
        if (onShowChooser) onShowChooser();
        else setOpen(true);
      }
      return;
    }
    setNativeAttempt(false);
    setRemember(false);
    if (onShowChooser) {
      onShowChooser();
      return;
    }
    setOpen(true);
  };
  const select = (provider: CalendarProvider) => {
    // Keep this synchronous so the browser permits the calendar window / Apple handoff.
    const keepChooserOpen = openProvider(provider);
    setOpen(!onShowChooser && keepChooserOpen);
    if (remember && preference.canRemember(provider)) void preference.remember(provider);
    return keepChooserOpen;
  };
  const fallbackOptions = nativeAttempt && links ? (
    <div className="mt-4 text-center text-sm">
      <div className="flex flex-wrap justify-center gap-2">
        <a href={links.outlook} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-current/25 px-3 py-2 font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
          Open Outlook in browser
        </a>
        <a href={links.appleInline.replace(/([?&])disposition=inline\b/, "$1disposition=attachment")} className="inline-flex min-h-11 items-center rounded-xl border border-current/25 px-3 py-2 font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
          Download event
        </a>
      </div>
    </div>
  ) : null;
  const rememberOption = (["google", "apple", "microsoft"] as const).some(preference.canRemember) ? (
    <label className="mt-4 flex min-h-11 items-center gap-3 text-left text-sm">
      <input
        type="checkbox"
        checked={remember}
        onChange={(event) => setRemember(event.target.checked)}
        className="size-4 shrink-0 accent-current"
      />
      {preference.signedIn
        ? "Remember a connected provider as my default calendar"
        : "Remember my default calendar"}
    </label>
  ) : null;
  const scanTextColor = scanTheme
    ? ensureReadableTextColor("#ffffff", scanTheme.text, { minContrast: 4.5 })
    : undefined;
  const scanIconBackground = scanTheme
    ? mixHexColors(scanTheme.primary, "#ffffff", 0.82) || "#ffffff"
    : "#ffffff";
  const providers: CalendarProvider[] = scanTheme
    ? ["google", "microsoft", "apple"]
    : ["google", "apple", "microsoft"];
  const dialog = (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className={`fixed inset-0 z-[13000] ${scanTheme ? "bg-black/75 backdrop-blur-md" : "bg-black/50"}`} />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-[13001] max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-white shadow-2xl ${scanTheme ? "rounded-[3.5rem] p-7 text-center sm:p-10" : "rounded-2xl border border-[#ddd4f8] p-5 text-[#2f2550]"}`}
          style={scanTheme ? { color: scanTextColor } : undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          {scanTheme ? (
            <div
              className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl"
              style={{
                backgroundColor: scanIconBackground,
                color: ensureReadableTextColor(
                  scanIconBackground,
                  scanTheme.primary,
                  { minContrast: 3 },
                ),
              }}
            >
              <Calendar className="size-10" aria-hidden="true" />
            </div>
          ) : null}
          <Dialog.Title className={scanTheme ? "serif text-2xl font-bold" : "pr-11 text-lg font-semibold"}>
            {scanTheme ? scanTheme.title || "Add it to your calendar" : "Add to calendar"}
          </Dialog.Title>
          <Dialog.Description className={scanTheme ? "sr-only" : "mt-1 text-sm text-[#6f5ba3]"}>
            Choose where to add this event.
          </Dialog.Description>
          <Dialog.Close
            className={`absolute inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-current ${scanTheme ? "right-4 top-4 hover:bg-black/5" : "right-2 top-2 hover:bg-[#f7f2ff]"}`}
            aria-label="Close calendar options"
          >
            <X className="size-4" aria-hidden="true" />
          </Dialog.Close>
          <div className={scanTheme ? "mt-6 space-y-4" : "mt-5 space-y-2"}>
            {providers.map((provider) => {
              const tone = scanTheme
                ? provider === "microsoft" ? scanTheme.secondary
                  : provider === "apple" ? scanTheme.apple || scanTheme.primary
                    : scanTheme.primary
                : null;
              return (
              <button
                key={provider}
                type="button"
                onClick={() => select(provider)}
                aria-label={CALENDAR_PROVIDER_NAMES[provider]}
                className={scanTheme
                  ? "block min-h-11 w-full rounded-[1.8rem] px-4 py-5 text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                  : "flex min-h-11 w-full items-center gap-3 rounded-xl border border-[#ddd4f8] px-4 py-3 text-left text-sm font-medium hover:bg-[#f7f2ff] focus-visible:outline-2 focus-visible:outline-violet-600"}
                style={tone ? {
                  backgroundColor: tone,
                  color: ensureReadableTextColor(tone, "#ffffff", { minContrast: 4.5 }),
                  outlineColor: scanTextColor,
                } : undefined}
              >
                {scanTheme ? (
                  provider === "microsoft" ? "Outlook" : provider === "apple" ? "Apple" : "Google"
                ) : (
                  <>
                    <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
                    {CALENDAR_PROVIDER_NAMES[provider]}
                  </>
                )}
              </button>
              );
            })}
          </div>
          {rememberOption}
          {fallbackOptions}
          {scanTheme ? (
            <Dialog.Close className="mt-4 min-h-11 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-current">
              Maybe later
            </Dialog.Close>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
  return { label, open, select, rememberOption, fallbackOptions, isOpen, hasDefault: Boolean(preference.provider), dialog };
}

export default function CalendarAction({
  links,
  className,
  labelClassName,
  children,
}: CalendarActionOptions & {
  className?: string;
  labelClassName?: string;
  children?: (label: string) => ReactNode;
}) {
  const calendar = useCalendarAction({ links });
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
