import { createRoot } from "react-dom/client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import SchoolMemoDates from "../../src/components/SchoolMemoDates";
import Dashboard from "../../src/components/Dashboard";
import GenericEventSkin from "../../src/components/GenericEventSkin";
import { ScannedScheduleProvider } from "../../src/components/ScannedSchedule";
import { normalizeScanSchedule } from "../../src/lib/scan-schedule";
import UnsavedProgressProvider from "../../src/components/UnsavedProgressProvider";

const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
};
const navigate = (url: string, replace = false) => {
  (window as any).__memoNavigations ||= [];
  (window as any).__memoNavigations.push(url);
  history[replace ? "replaceState" : "pushState"](null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
const router = { push: (url: string) => navigate(url), replace: (url: string) => navigate(url, true), back() {}, forward() {}, refresh() {}, prefetch: async () => {} };

function FinishedMemo() {
  const editing = location.pathname === "/event/general/customize";
  const [row, setRow] = useState<any>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/history/memo-fixture", { signal: controller.signal }).then(response => response.json()).then(setRow);
    return () => controller.abort();
  }, []);
  if (!row) return <p role="status">Opening finished event…</p>;
  const schedule = normalizeScanSchedule(row.data.scanSchedule)!;
  if (editing) return <main>
    <SchoolMemoDates schedule={schedule} onScheduleChange={next => setRow({ ...row, data: { ...row.data, scanSchedule: next } })} />
    <button onClick={async () => {
      const response = await fetch("/api/history/memo-fixture", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: { ...row.data, status: "published", draftStatus: "published" } }) });
      setRow(await response.json());
      navigate("/event/weekly-school-memo?tab=event");
    }}>Publish</button>
  </main>;
  return <ScannedScheduleProvider schedule={schedule} eventId={row.id} canManage published={row.data.status === "published" && row.data.draftStatus !== "draft"}>
    <GenericEventSkin eventId={row.id} title={row.title} categoryLabel="School event" schoolMemo dateLabel={`${schedule.items.length} dates in this memo`} detailCopy={row.data.description} calendarLinks={null} actions={<a href="#schedule">Dates from this memo</a>} />
  </ScannedScheduleProvider>;
}
function App() {
  const pathname = useSyncExternalStore(subscribe, () => location.pathname);
  return pathname.startsWith("/event/") ? <FinishedMemo /> : <Dashboard snapProcessingMode />;
}
createRoot(document.getElementById("root")!).render(<AppRouterContext.Provider value={router}><UnsavedProgressProvider><App /></UnsavedProgressProvider></AppRouterContext.Provider>);
