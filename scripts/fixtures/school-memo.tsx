import { createRoot } from "react-dom/client";
import { useState } from "react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import SchoolMemoDates from "../../src/components/SchoolMemoDates";
import ScheduleReviewDialog from "../../src/components/ScheduleReviewDialog";
import UnsavedProgressProvider from "../../src/components/UnsavedProgressProvider";
import { normalizeScanSchedule, type ScanSchedule } from "../../src/lib/scan-schedule";

const initial = normalizeScanSchedule({
  kind: "school-memo", issueDate: "2026-10-26", title: "Mrs. Example's Weekly Memo", timeframe: "Week of October 26", timezone: "America/Chicago",
  items: [
    { id: "spirit", type: "event", title: "Spirit Week", date: "2026-10-26", endDate: "2026-10-30", sourceText: "Spirit Week October 26th - 30th", yearInferred: true },
    { id: "bible", type: "test", title: "Bible Test", date: "2026-10-30", sourceText: "Bible Test this Friday October 30th", yearInferred: true },
    { id: "spelling", type: "test", title: "Spelling Test", date: "2026-10-30", sourceText: "Spelling Test this Friday October 30th", yearInferred: true },
    { id: "pumpkin", type: "event", title: "Pumpkin Day", date: "2026-10-30", notes: "During lunch; exact time not supplied.", sourceText: "Pumpkin Day - during lunch this Friday October 30th", yearInferred: true },
    { id: "closure", type: "closure", title: "No School", date: "2026-11-11", sourceText: "No School Wednesday November 11th", yearInferred: true },
    { id: "turkey", type: "event", title: "Turkey Trot", date: "2026-11-16", sourceText: "Turkey Trot Monday November 16th", yearInferred: true },
  ],
})!;
const query = new URLSearchParams(location.search);
const router = { push: (url: string) => history.pushState(null, "", url), replace: (url: string) => history.replaceState(null, "", url), back() {}, forward() {}, refresh() {}, prefetch: async () => {} };
(window as any).__memoSaves = [];
function App() {
  const [schedule, setSchedule] = useState<ScanSchedule>(() => query.has("restore") ? JSON.parse(localStorage.getItem("school-memo-fixture") || "null") || initial : initial);
  const [review, setReview] = useState(query.has("review"));
  return <main className="mx-auto max-w-3xl p-4 sm:p-8">
    <button type="button" className="mb-4 min-h-11 rounded-xl border px-4" onClick={() => setReview(true)}>Edit memo</button>
    {review ? <ScheduleReviewDialog initialSchedule={schedule} saved savedStatus="draft" onDiscard={() => setReview(false)} onSave={async (next, status) => {
      (window as any).__memoSaves.push({ schedule: structuredClone(next), status });
      localStorage.setItem("school-memo-fixture", JSON.stringify(next)); setSchedule(next); setReview(false);
      const target = new URL(location.href); target.searchParams.delete("review"); return target.pathname + target.search;
    }} /> : <SchoolMemoDates schedule={schedule} eventId="memo-fixture" canManage />}
  </main>;
}
createRoot(document.getElementById("root")!).render(<AppRouterContext.Provider value={router}><UnsavedProgressProvider><App /></UnsavedProgressProvider></AppRouterContext.Provider>);
