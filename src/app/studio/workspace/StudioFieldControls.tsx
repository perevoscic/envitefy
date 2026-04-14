"use client";

import { Clock, MapPin } from "lucide-react";
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

function renderFieldIcon(fieldKey: keyof EventDetails) {
  if (fieldKey === "startTime") {
    return <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />;
  }
  if (fieldKey === "location") {
    return <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />;
  }
  return null;
}

function usesIconInput(fieldKey: keyof EventDetails) {
  return fieldKey === "startTime" || fieldKey === "location";
}

export function StudioFieldGrid({
  details,
  setDetails,
  fields,
  requiredOnly = false,
  columnsClassName = "grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2 lg:grid-cols-3",
}: StudioFieldGridProps) {
  const fieldLabelClass = studioWorkspaceFieldLabelClass;
  const inputClass = studioWorkspaceInputClass;
  const iconInputClass = studioWorkspaceIconInputClass;
  const textAreaClass = studioWorkspaceTextAreaClass;
  const visibleFields = requiredOnly ? fields.filter((field) => field.required) : fields;

  return (
    <div className={columnsClassName}>
      {visibleFields.map((field) => {
        const showRequiredMark = Boolean(field.required);
        const value = inputValue(details[field.key]);
        return (
          <div
            key={field.key}
            className={`flex min-w-0 flex-col space-y-2 ${field.type === "textarea" ? "col-span-full" : ""}`}
          >
            <label className={fieldLabelClass}>
              {field.label}
              {showRequiredMark ? <span className="text-[#8a6fdb]"> *</span> : null}
            </label>
            {field.type === "textarea" ? (
              <textarea
                placeholder={field.placeholder}
                className={textAreaClass}
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
                className={`${inputClass} appearance-none`}
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
              <label className="inline-flex w-full max-w-full items-center gap-3 rounded-2xl border border-[#e8e0f5] bg-white px-4 py-3 text-sm text-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    setDetails((prev) => ({
                      ...prev,
                      [field.key]: event.target.checked,
                    }))
                  }
                />
                <span>{field.placeholder || field.label}</span>
              </label>
            ) : (
              <div className="relative">
                {renderFieldIcon(field.key)}
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className={
                    usesIconInput(field.key)
                      ? `${iconInputClass} pl-12`
                      : inputClass
                  }
                  value={String(value)}
                  onChange={(event) =>
                    setDetails((prev) => ({
                      ...prev,
                      [field.key]: event.target.value,
                    }))
                  }
                />
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
        {required ? <span className="text-[#8a6fdb]"> *</span> : null}
      </label>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        className={textAreaClass}
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
