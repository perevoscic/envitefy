"use client";

import InlineEditableText from "@/components/events/InlineEditableText";
import { useRef, type ReactNode } from "react";
import {
  GYMNASTICS_PAGE_TEXT_LABELS,
  gymnasticsPageTextLimit,
  isGymnasticsStandaloneTextKey,
  isGymnasticsTextCopyKey,
  parseGymnasticsTextPlacement,
  type GymnasticsPageText,
  type GymnasticsPageTextChange,
  type GymnasticsPageTextKey,
  type GymnasticsTextCopyKey,
} from "@/lib/gymnastics-page-text";
import styles from "@/components/events/inline-editable-text.module.css";

function PageTextLine({
  text, onChange, textKey, fallback, label, renderText,
}: {
  text?: GymnasticsPageText;
  onChange?: GymnasticsPageTextChange;
  textKey: GymnasticsPageTextKey;
  fallback: string;
  label: string;
  renderText?: (text: string) => ReactNode;
}) {
  const group = useRef<HTMLSpanElement>(null);
  const standalone = isGymnasticsStandaloneTextKey(textKey);
  const copies = standalone ? Object.entries(text ?? {}).filter(
    (entry): entry is [GymnasticsTextCopyKey, string] =>
      isGymnasticsTextCopyKey(entry[0]) && entry[0].split(":")[1] === textKey && typeof entry[1] === "string",
  ) : [];
  const duplicate = standalone && onChange ? (value: string) => {
    onChange(`copy:${textKey}:${crypto.randomUUID()}:text`, value);
  } : undefined;
  const original = (
    <InlineEditableText
      label={label}
      value={text?.[textKey]}
      fallback={fallback}
      maxLength={gymnasticsPageTextLimit(textKey)}
      multiline={gymnasticsPageTextLimit(textKey) > 240}
      removable={standalone}
      onDuplicate={duplicate}
      placement={standalone ? parseGymnasticsTextPlacement(text?.[`placement:${textKey}`]) : undefined}
      onPlacementChange={standalone && onChange ? (placement) =>
        onChange(`placement:${textKey}`, placement ? JSON.stringify(placement) : undefined) : undefined}
      onChange={onChange ? (value) => onChange(textKey, value) : undefined}
      renderText={renderText}
    />
  );
  if (!standalone) return original;
  return (
    <span ref={group} className={copies.length ? styles.copies : undefined}>
      {original}
      {copies.map(([key, value]) => (
        <InlineEditableText
          key={key}
          label={`${label} copy`}
          value={value}
          fallback=""
          maxLength={gymnasticsPageTextLimit(textKey)}
          multiline={gymnasticsPageTextLimit(textKey) > 240}
          removable
          onDuplicate={duplicate}
          placement={parseGymnasticsTextPlacement(text?.[`placement:${key}`])}
          onPlacementChange={onChange ? (placement) =>
            onChange(`placement:${key}`, placement ? JSON.stringify(placement) : undefined) : undefined}
          onChange={onChange ? (next) => onChange(key, next) : undefined}
          onRemove={onChange ? () => {
            onChange(key, undefined);
            requestAnimationFrame(() => group.current?.querySelector("button")?.focus({ preventScroll: true }));
          } : undefined}
        />
      ))}
    </span>
  );
}

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
    <PageTextLine
      key={key}
      textKey={key}
      text={text}
      label={
        label ??
        GYMNASTICS_PAGE_TEXT_LABELS[key as keyof typeof GYMNASTICS_PAGE_TEXT_LABELS] ??
        "Page text"
      }
      fallback={fallback}
      onChange={onChange}
      renderText={renderText}
    />
  );
}
