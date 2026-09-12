"use client";

import InlineEditableText from "@/components/events/InlineEditableText";
import type { ReactNode } from "react";
import {
  GYMNASTICS_PAGE_TEXT_LABELS,
  gymnasticsPageTextLimit,
  type GymnasticsPageText,
  type GymnasticsPageTextChange,
  type GymnasticsPageTextKey,
} from "@/lib/gymnastics-page-text";

export function useGymnasticsPageText(
  text: GymnasticsPageText | undefined,
  onChange?: GymnasticsPageTextChange,
) {
  return (
    key: GymnasticsPageTextKey,
    fallback: string,
    label?: string,
    renderText?: (text: string) => ReactNode,
  ) => (
    <InlineEditableText
      key={key}
      label={
        label ??
        GYMNASTICS_PAGE_TEXT_LABELS[key as keyof typeof GYMNASTICS_PAGE_TEXT_LABELS] ??
        "Page text"
      }
      value={text?.[key]}
      fallback={fallback}
      maxLength={gymnasticsPageTextLimit(key)}
      multiline={gymnasticsPageTextLimit(key) > 240}
      onChange={onChange ? (value) => onChange(key, value) : undefined}
      renderText={renderText}
    />
  );
}
