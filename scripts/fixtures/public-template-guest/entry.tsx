import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import AppShell from "../../../src/app/AppShell";
import { SidebarProvider } from "../../../src/app/sidebar-context";
import AppearanceProvider from "../../../src/components/AppearanceProvider";
import UnsavedProgressProvider from "../../../src/components/UnsavedProgressProvider";
import TemplateEditorProvider, { useTemplateEditor, useTemplateState } from "../../../src/components/templates/TemplateEditorContext";
import SignupTemplatesPage from "../../../src/app/templates/signup/page";
import EventEditorWorkspace from "../../../src/components/events/EventEditorWorkspace";
import { useEventPageEditor } from "../../../src/components/events/useEventPageEditor";
import { useEventHistoryClient } from "../../../src/lib/event-history-client";
import { usePathname } from "../signup-editor/navigation";

const navigate = (url: string, replace = false) => {
  history[replace ? "replaceState" : "pushState"](null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
const router = { push: (url: string) => navigate(url), replace: (url: string) => navigate(url, true), back: () => history.back(), forward: () => history.forward(), refresh() {}, prefetch: async () => {} };

function EventFields() {
  const [data, setData] = useTemplateState("data", { title: "Birthday celebration" });
  const template = useTemplateEditor()!;
  const historyClient = useEventHistoryClient();
  const editor = useEventPageEditor({
    snapshot: { data }, category: "birthdays", historyClient,
    buildPayload: async () => {
      if (!data.title.trim()) throw new Error("Give your event a title.");
      return { title: data.title, data: { title: data.title, primaryOutput: "event_page" } };
    },
  });
  return <EventEditorWorkspace editor={editor} preview={<h1>{data.title}</h1>} customUrlMenu={false} controls={<div style={{ padding: 24 }}>
    <label>Event title<input value={data.title} onChange={(event) => setData({ ...data, title: event.target.value })} /></label>
    <button type="button" onClick={() => void template.requestSave()}>Save event draft</button>
  </div>} />;
}

function App() {
  const pathname = usePathname();
  const signup = pathname.startsWith("/signup-forms/");
  return <AppearanceProvider><SidebarProvider><AppShell><UnsavedProgressProvider>
    {pathname.includes("customize") ? <TemplateEditorProvider
      category={signup ? "signup-forms" : "birthdays"} templateId={signup ? "editorial--school-days" : "party-pop"}>
      {signup ? <SignupTemplatesPage /> : <EventFields />}
    </TemplateEditorProvider> : <p data-destination>Destination: {pathname}</p>}
  </UnsavedProgressProvider></AppShell></SidebarProvider></AppearanceProvider>;
}
createRoot(document.getElementById("root")!).render(<AppRouterContext.Provider value={router}><App /></AppRouterContext.Provider>);
