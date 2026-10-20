"use client";

import {
  readWebsiteImport,
  WEBSITE_SECTIONS,
  type WebsiteCoverage,
} from "@/lib/discovery/event-website";

const labels: Record<WebsiteCoverage["status"], string> = {
  collected: "Collected",
  unavailable: "Not published",
  failed: "Could not load",
  pending: "Needs review",
  not_found: "No source found",
};

export default function WebsiteImportCoverage({ value }: { value: unknown }) {
  const website = readWebsiteImport(value);
  if (!website) return null;
  const collected = website.coverage.filter((item) => item.status === "collected").length;
  const unavailable = website.coverage.filter((item) => item.status === "unavailable").length;
  const failed = website.coverage.filter((item) => item.status === "failed").length;
  const pending = website.coverage.filter((item) => item.status === "pending").length;
  const notFound = website.coverage.filter((item) => item.status === "not_found").length;
  return (
    <details className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 text-slate-800">
      <summary className="min-h-11 cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
        Website sources: {collected} collected{unavailable ? ` · ${unavailable} not published` : ""}
        {failed ? ` · ${failed} could not load` : ""}
        {pending ? ` · ${pending} need review` : ""}
        {notFound ? ` · ${notFound} not found` : ""}
      </summary>
      <ul className="mt-3 space-y-4">
        {website.coverage.map((item) => (
          <li key={item.section}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">{WEBSITE_SECTIONS[item.section]}</span>
              <span
                className={
                  item.status === "failed" ? "font-semibold text-red-700" : "text-slate-600"
                }
              >
                {labels[item.status]}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.reason}</p>
            {item.sourceUrls.map((url, index) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center pr-4 text-sm text-violet-700 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                View source{item.sourceUrls.length > 1 ? ` ${index + 1}` : ""}
              </a>
            ))}
          </li>
        ))}
      </ul>
    </details>
  );
}
