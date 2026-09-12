"use client";

import { Upload } from "lucide-react";
import { type ComponentPropsWithoutRef, useId, useState } from "react";

type FileUploadInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "value" | "defaultValue" | "className"
> & {
  buttonLabel?: string;
  selectedFileName?: string;
};

/** A native file picker with a visible button and separate selection feedback. */
export default function FileUploadInput({
  id,
  buttonLabel,
  selectedFileName,
  multiple,
  onChange,
  "aria-describedby": describedBy,
  ...props
}: FileUploadInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const statusId = `${inputId}-selection`;
  const [localFileName, setLocalFileName] = useState("");
  const fileName = selectedFileName ?? localFileName;
  const actionLabel =
    buttonLabel || `${fileName ? "Change" : "Choose"} ${multiple ? "files" : "file"}`;

  return (
    <div className="relative min-w-0 space-y-2">
      <input
        {...props}
        id={inputId}
        type="file"
        multiple={multiple}
        className="peer sr-only"
        aria-describedby={[describedBy, statusId].filter(Boolean).join(" ")}
        onChange={(event) => {
          setLocalFileName(
            Array.from(event.currentTarget.files || [], (file) => file.name).join(", "),
          );
          onChange?.(event);
        }}
      />
      <label
        htmlFor={inputId}
        className="inline-flex min-h-11 max-w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-violet-700 bg-violet-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:border-violet-800 hover:bg-violet-800 active:bg-violet-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-violet-600 peer-disabled:pointer-events-none peer-disabled:cursor-not-allowed peer-disabled:opacity-60 motion-reduce:transition-none"
      >
        <Upload size={18} className="shrink-0" aria-hidden="true" />
        {actionLabel}
      </label>
      <p id={statusId} role="status" className="break-all text-xs leading-relaxed text-slate-600">
        {fileName ? `Selected: ${fileName}` : multiple ? "No files selected" : "No file selected"}
      </p>
    </div>
  );
}
