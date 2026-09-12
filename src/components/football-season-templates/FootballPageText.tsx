"use client";

import { createContext, useContext, type ReactNode } from "react";
import InlineEditableText from "@/components/events/InlineEditableText";
import {
  footballCopyKey,
  footballPageTextLimit,
  type FootballPageText,
  type FootballPageTextChange,
  type FootballPageTextKey,
} from "@/lib/football-page-text";

const Context = createContext<{
  text?: FootballPageText;
  onChange?: FootballPageTextChange;
  title?: string;
  details?: string;
}>({});
export function FootballPageTextProvider({
  children,
  ...value
}: {
  children: ReactNode;
  text?: FootballPageText;
  onChange?: FootballPageTextChange;
  title?: string;
  details?: string;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useFootballPageText() {
  return useContext(Context);
}

export default function FootballText({
  textKey,
  fallback,
  label,
  renderText,
}: {
  textKey?: FootballPageTextKey;
  fallback: string;
  label?: string;
  renderText?: (text: string) => ReactNode;
}) {
  const context = useFootballPageText();
  const key = textKey ?? footballCopyKey(fallback);
  const value =
    key === "eventTitle"
      ? context.title || undefined
      : key === "eventDetails"
        ? context.details || undefined
        : context.text?.[key];
  return (
    <InlineEditableText
      label={
        label ||
        (key === "eventTitle"
          ? "Event title"
          : key === "eventDetails"
            ? "Event description"
            : fallback || "Page text")
      }
      value={value}
      fallback={fallback}
      maxLength={footballPageTextLimit(key)}
      multiline={footballPageTextLimit(key) > 240}
      onChange={context.onChange ? (next) => context.onChange?.(key, next) : undefined}
      renderText={renderText}
    />
  );
}
