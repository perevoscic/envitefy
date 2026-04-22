"use client";

import { Calendar, Clock3, MapPin } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { inputValue } from "../studio-workspace-builders";
import type { EventDetails, FieldConfig, SharedFieldConfig } from "../studio-workspace-types";
import {
  studioWorkspaceFieldLabelClass,
  studioWorkspaceIconInputClass,
  studioWorkspaceInputClass,
  studioWorkspaceTextAreaClass,
} from "../studio-workspace-ui-classes";

type SupportedField = FieldConfig | SharedFieldConfig;

type StudioFieldGridProps = {
  details: EventDetails;
  setDetails: Dispatch<SetStateAction<EventDetails>>;
  fields: SupportedField[];
  requiredOnly?: boolean;
  columnsClassName?: string;
  isMobileViewport?: boolean;
};

type StudioTextAreaFieldProps = {
  details: EventDetails;
  setDetails: Dispatch<SetStateAction<EventDetails>>;
  fieldKey: keyof EventDetails;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  id?: string;
};

const studioMutedFieldIconBaseClass =
  "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#c8d2e2]";

function studioMutedFieldIconClass(
  fieldKey: keyof EventDetails,
  renderedInputType: string,
  isMobileViewport: boolean,
) {
  const positionClass =
    fieldKey === "eventDate" || renderedInputType === "date"
      ? isMobileViewport
        ? "right-0"
        : "right-3"
      : "right-0";
  return `${studioMutedFieldIconBaseClass} ${positionClass}`;
}

function studioPlaceholderRightClass(
  fieldKey: keyof EventDetails,
  renderedInputType: string,
  isMobileViewport: boolean,
) {
  if (!usesIconInput(fieldKey, renderedInputType)) return "right-0";
  return fieldKey === "eventDate" || renderedInputType === "date"
    ? isMobileViewport
      ? "right-5"
      : "right-7"
    : "right-8";
}

function renderFieldIcon(
  fieldKey: keyof EventDetails,
  renderedInputType: string,
  isMobileViewport: boolean,
) {
  if (fieldKey === "location") {
    return (
      <MapPin
        className={studioMutedFieldIconClass(fieldKey, renderedInputType, isMobileViewport)}
      />
    );
  }
  if (fieldKey === "eventDate" || renderedInputType === "date") {
    return (
      <Calendar
        className={studioMutedFieldIconClass(fieldKey, renderedInputType, isMobileViewport)}
      />
    );
  }
  if (renderedInputType === "time") {
    return (
      <Clock3
        className={studioMutedFieldIconClass(fieldKey, renderedInputType, isMobileViewport)}
      />
    );
  }
  return null;
}

function usesIconInput(fieldKey: keyof EventDetails, renderedInputType: string) {
  return (
    fieldKey === "location" ||
    fieldKey === "eventDate" ||
    renderedInputType === "date" ||
    renderedInputType === "time"
  );
}

function usesNativePickerIndicator(renderedInputType: string) {
  return renderedInputType === "date" || renderedInputType === "time";
}

function isMonthDayOnlyEventDateField(details: EventDetails, fieldKey: keyof EventDetails) {
  return fieldKey === "eventDate" && details.category !== "Wedding";
}

function normalizeStudioMonthDayInput(value: string): string {
  const trimmed = value.replace(/[^\d/]/g, "").slice(0, 5);
  const slashMatch = trimmed.match(/^(\d{1,2})(?:\/(\d{0,2}))?$/);
  if (slashMatch) {
    const month = slashMatch[1] || "";
    const day = slashMatch[2] || "";
    return day || trimmed.includes("/") ? `${month}/${day}` : month;
  }
  const digits = trimmed.replace(/\D+/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatStudioMonthDayValue(value: string): string {
  const trimmed = String(value ?? "").trim();
  const isoMatch = trimmed.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}/${isoMatch[2]}`;
  return normalizeStudioMonthDayInput(trimmed);
}

function fieldWidthClass(field: SupportedField, isMobileViewport: boolean) {
  if (field.key === "eventDate") {
    return isMobileViewport ? "max-w-[7.85rem] sm:max-w-[7rem]" : "max-w-[6.6rem] sm:max-w-[7rem]";
  }
  if (field.key === "startTime") {
    return isMobileViewport ? "max-w-[8.3rem] sm:max-w-[9rem]" : "max-w-[8.6rem] sm:max-w-[9rem]";
  }
  if ("compact" in field && field.compact) return "max-w-[7.5rem]";
  return "";
}

function mobileCompactFieldTextClass(
  fieldKey: keyof EventDetails,
  renderedInputType: string,
  isMobileViewport: boolean,
) {
  if (!isMobileViewport) return "";
  if (fieldKey === "eventDate" || renderedInputType === "date") {
    return "text-[1.4rem] sm:text-2xl";
  }
  if (fieldKey === "startTime" || renderedInputType === "time") {
    return "text-[1.32rem] tracking-[-0.01em] sm:text-2xl sm:tracking-normal";
  }
  return "";
}

function formatStudioMonthDayPickerValue(value: string): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) return trimmed;
  const monthDayMatch = formatStudioMonthDayValue(trimmed).match(/^(\d{2})\/(\d{2})$/);
  if (!monthDayMatch) return "";
  return `${new Date().getFullYear()}-${monthDayMatch[1]}-${monthDayMatch[2]}`;
}

function openNativePicker(input: HTMLInputElement) {
  const pickerInput = input as HTMLInputElement & {
    showPicker?: () => void;
  };
  if (typeof pickerInput.showPicker !== "function") return;
  try {
    pickerInput.showPicker();
  } catch {
    // Some browsers reject showPicker unless it follows a trusted gesture.
  }
}

export function StudioFieldGrid({
  details,
  setDetails,
  fields,
  requiredOnly = false,
  columnsClassName = "grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2 lg:grid-cols-3",
  isMobileViewport = false,
}: StudioFieldGridProps) {
  const fieldLabelClass = studioWorkspaceFieldLabelClass;
  const inputClass = studioWorkspaceInputClass;
  const iconInputClass = studioWorkspaceIconInputClass;
  const textAreaClass = studioWorkspaceTextAreaClass;
  const visibleFields = requiredOnly ? fields.filter((field) => field.required) : fields;

  return (
    <div className={columnsClassName}>
      {visibleFields.map((field) => {
        const isMonthDayOnlyField = isMonthDayOnlyEventDateField(details, field.key);
        const showRequiredMark = Boolean(field.required);
        const rawValue = String(inputValue(details[field.key]) ?? "");
        const renderedInputType = isMonthDayOnlyField && !isMobileViewport ? "text" : field.type;
        const renderedPlaceholder = isMonthDayOnlyField ? "mm/dd" : field.placeholder;
        const renderedInputMode = isMonthDayOnlyField
          ? "numeric"
          : "inputMode" in field
            ? field.inputMode
            : undefined;
        const hidesNativePickerIndicator = usesNativePickerIndicator(renderedInputType);
        const renderedMaxLength = isMonthDayOnlyField
          ? 5
          : "maxLength" in field
            ? field.maxLength
            : undefined;
        const timeIconInputClass =
          renderedInputType === "time"
            ? iconInputClass.replace("pr-8", "pr-0")
            : iconInputClass;
        const compactMobileTextClass = mobileCompactFieldTextClass(
          field.key,
          renderedInputType,
          isMobileViewport,
        );
        const value = isMonthDayOnlyField
          ? renderedInputType === "date"
            ? formatStudioMonthDayPickerValue(rawValue)
            : formatStudioMonthDayValue(rawValue)
          : rawValue;
        const isEmptyValue = value.trim() === "";
        return (
          <div
            key={field.key}
            className={`flex min-w-0 flex-col space-y-4 ${field.type === "textarea" ? "col-span-full" : ""}`}
          >
            <label className={fieldLabelClass}>
              {field.label}
              {showRequiredMark ? <span className="ml-1 text-[#1A1A1A]/35">*</span> : null}
            </label>
            {field.type === "textarea" ? (
              <textarea
                placeholder={field.placeholder}
                className={`${textAreaClass} ${isEmptyValue ? "studio-editorial-empty" : "studio-editorial-filled"} font-[var(--font-playfair)] resize-none`}
                value={String(value)}
                onChange={(event) =>
                  setDetails((prev) => ({
                    ...prev,
                    [field.key]: event.target.value,
                  }))
                }
              />
            ) : field.type === "select" ? (
              <select
                className={`${inputClass} appearance-none font-[var(--font-playfair)] text-[1.65rem]`}
                value={String(value)}
                onChange={(event) =>
                  setDetails((prev) => ({
                    ...prev,
                    [field.key]: event.target.value as EventDetails[typeof field.key],
                  }))
                }
              >
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <label className="inline-flex w-full max-w-full items-center gap-3 border-b border-[#1A1A1A]/18 pb-3 text-sm text-[#5F5345]">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    setDetails((prev) => ({
                      ...prev,
                      [field.key]: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[#cdbba8] text-[#1A1A1A] focus:ring-[#8C7B65]/30"
                />
                <span className="font-medium uppercase tracking-[0.16em]">
                  {field.placeholder || field.label}
                </span>
              </label>
            ) : (
              <div className={`group relative ${fieldWidthClass(field, isMobileViewport)}`}>
                {renderFieldIcon(field.key, renderedInputType, isMobileViewport)}
                <input
                  type={renderedInputType}
                  placeholder={renderedInputType === "text" ? "" : renderedPlaceholder}
                  inputMode={renderedInputMode}
                  maxLength={renderedMaxLength}
                  className={
                    usesIconInput(field.key, renderedInputType)
                      ? `${timeIconInputClass} ${
                          hidesNativePickerIndicator
                            ? "appearance-none [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                            : ""
                        } ${compactMobileTextClass} ${isEmptyValue ? "studio-editorial-empty" : "studio-editorial-filled"} font-[var(--font-playfair)]`
                      : `${inputClass} ${isEmptyValue ? "studio-editorial-empty" : "studio-editorial-filled"} font-[var(--font-playfair)]`
                  }
                  style={
                    hidesNativePickerIndicator
                      ? { WebkitAppearance: "none", appearance: "none" }
                      : undefined
                  }
                  value={value}
                  onClick={(event) => {
                    if (
                      isMobileViewport &&
                      (renderedInputType === "date" || renderedInputType === "time")
                    ) {
                      openNativePicker(event.currentTarget);
                    }
                  }}
                  onFocus={(event) => {
                    if (
                      isMobileViewport &&
                      (renderedInputType === "date" || renderedInputType === "time")
                    ) {
                      openNativePicker(event.currentTarget);
                    }
                  }}
                  onChange={(event) => {
                    let nextValue = event.target.value;
                    if (isMonthDayOnlyField) {
                      nextValue =
                        renderedInputType === "date"
                          ? formatStudioMonthDayValue(nextValue)
                          : normalizeStudioMonthDayInput(nextValue);
                    } else if ("inputMode" in field && field.inputMode === "numeric") {
                      nextValue = nextValue.replace(/\D+/g, "");
                    }
                    if (typeof renderedMaxLength === "number") {
                      nextValue = nextValue.slice(0, renderedMaxLength);
                    }
                    setDetails((prev) => ({
                      ...prev,
                      [field.key]: nextValue,
                    }));
                  }}
                />
                {renderedInputType === "text" && isEmptyValue && renderedPlaceholder ? (
                  <span
                    className={`pointer-events-none absolute left-0 top-1/2 block -translate-y-1/2 overflow-hidden whitespace-nowrap text-ellipsis font-[var(--font-playfair)] text-2xl italic text-[#d9dfe9] transition-opacity group-focus-within:opacity-0 ${studioPlaceholderRightClass(field.key, renderedInputType, isMobileViewport)}`}
                  >
                    {renderedPlaceholder}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StudioTextAreaField({
  details,
  setDetails,
  fieldKey,
  label,
  placeholder,
  rows = 4,
  required = false,
  id,
}: StudioTextAreaFieldProps) {
  const fieldLabelClass = studioWorkspaceFieldLabelClass;
  const textAreaClass = studioWorkspaceTextAreaClass;

  return (
    <div className="min-w-0 space-y-3">
      <label className={fieldLabelClass} htmlFor={id}>
        {label}
        {required ? <span className="ml-1 text-[#1A1A1A]/35">*</span> : null}
      </label>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        className={`${textAreaClass} ${String(inputValue(details[fieldKey]) ?? "").trim() === "" ? "studio-editorial-empty" : "studio-editorial-filled"} font-[var(--font-playfair)] resize-none`}
        value={String(inputValue(details[fieldKey]))}
        onChange={(event) =>
          setDetails((prev) => ({
            ...prev,
            [fieldKey]: event.target.value,
          }))
        }
      />
    </div>
  );
}
