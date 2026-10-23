import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import UnsavedProgressProvider from "../../src/components/UnsavedProgressProvider";
import TemplateEditorProvider from "../../src/components/templates/TemplateEditorContext";
import Sports from "../../src/app/event/sport-events/customize/page";
import Bridal from "../../src/app/event/baby-showers/customize/page";
import General from "../../src/app/event/general/customize/page";
import SimpleTemplateView from "../../src/components/SimpleTemplateView";
import BabyShowerTemplateView from "../../src/components/BabyShowerTemplateView";
import { useSearchParams } from "./signup-editor/navigation";

const navigate = (url: string, replace = false) => {
  history[replace ? "replaceState" : "pushState"](null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
};
const router = { push: (url: string) => navigate(url), replace: (url: string) => navigate(url, true), back: () => history.back(), forward: () => history.forward(), refresh() {}, prefetch: async () => {} };
function Guest({ id, bridal }: { id: string; bridal: boolean }) {
  const [row, setRow] = useState<any>(null);
  useEffect(() => { void fetch(`/api/history/${id}`).then((response) => response.json()).then(setRow); }, [id]);
  if (!row) return null;
  return bridal
    ? <BabyShowerTemplateView eventId={id} eventData={row.data} eventTitle={row.title} isOwner={false} isReadOnly shareUrl="" editHref="" preview />
    : <SimpleTemplateView eventId={id} eventData={row.data} eventTitle={row.title} isOwner={false} isReadOnly viewerKind="readonly" shareUrl="" sessionEmail={null} />;
}
function App() {
  const search = useSearchParams();
  // Publication leaves the editor route in Next; the isolated fixture stops rendering it too.
  if (!search.get("collection")) return null;
  const bridal = search.get("collection") === "bridal-showers";
  const general = ["graduations", "housewarming", "open-house", "religious-events", "holidays-seasonal"].includes(search.get("collection") || "");
  return <UnsavedProgressProvider>{search.has("guest")
    ? <Guest id={search.get("id")!} bridal={bridal} />
    : general ? <General /> : <TemplateEditorProvider category={bridal ? "bridal-showers" : "sport-events"} templateId={search.get("templateId")!}>
      {bridal ? <Bridal /> : <Sports />}
    </TemplateEditorProvider>}</UnsavedProgressProvider>;
}
createRoot(document.getElementById("root")!).render(<AppRouterContext.Provider value={router}><App /></AppRouterContext.Provider>);
