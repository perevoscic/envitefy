"use client";

import { useId, useState, type IframeHTMLAttributes } from "react";

/** Inbox mode is independent of the app's appearance, and never modifies the saved HTML. */
export default function EmailPreviewFrame({ srcDoc = "", title = "Email preview", ...props }: IframeHTMLAttributes<HTMLIFrameElement>) {
  const id = useId();
  const [mode, setMode] = useState<"light" | "dark">("light");
  const preview = srcDoc.replace(/@media\s*\(prefers-color-scheme:\s*dark\)/gi,
    mode === "dark" ? "@media all" : "@media not all");
  return <div className="flex h-full min-h-0 w-full min-w-0 flex-col items-center">
    <div className="mb-3 flex w-full shrink-0 items-center justify-end gap-2 text-sm">
      <label htmlFor={id}>Inbox appearance</label>
      <select id={id} value={mode} onChange={event => setMode(event.target.value as "light" | "dark")} className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--foreground)]">
        <option value="light">Light inbox</option><option value="dark">Dark inbox</option>
      </select>
    </div>
    <iframe {...props} title={title} srcDoc={preview} />
  </div>;
}
