import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import UnsavedProgressProvider from "../../src/components/UnsavedProgressProvider";
import EventEditorWorkspace from "../../src/components/events/EventEditorWorkspace";
import { useEventPageEditor } from "../../src/components/events/useEventPageEditor";
import { useEventHistoryClient } from "../../src/lib/event-history-client";
import EventUrlDialog from "../../src/components/events/EventUrlEditor";
import LiveCardBuilder from "../../src/app/live-cards/LiveCardBuilder";
import TemplateEditorProvider from "../../src/components/templates/TemplateEditorContext";
import SignupTemplatesPage from "../../src/app/templates/signup/page";
import { createLiveCardForm } from "../../src/lib/livecard-builder";
import { createSignupThemeForm } from "../../src/lib/signup-starters";

const search = new URLSearchParams(location.search);
const id = search.get("edit") || undefined;
const mode = search.get("mode");
const router = { push() {}, replace() {}, back() {}, forward() {}, refresh() {}, prefetch: async () => {} };
(window as any).__urlFixtures = { createLiveCardForm, createSignupThemeForm };

function PageEditor() {
  const client = useEventHistoryClient();
  const [ready, setReady] = useState(!id);
  const [title, setTitle] = useState("Original page title");
  useEffect(() => {
    if (id) void client.fetch(`/api/history/${id}`).then(response => response.json()).then(row => { setTitle(row.title); setReady(true); });
  }, [client]);
  const editor = useEventPageEditor({ snapshot: { data: { title } }, category: "general", eventId: id, historyClient: client, ready,
    buildPayload: async () => ({ title, data: { title, primaryOutput: "event_page" } }),
  });
  return <EventEditorWorkspace editor={editor} preview={<h1>{title}</h1>} controls={<label>Event title<input value={title} onChange={event => setTitle(event.target.value)} /></label>} />;
}

function App() {
  return <UnsavedProgressProvider>{mode === "page" ? <PageEditor /> : mode === "livecard" ? <LiveCardBuilder initialEventId={id || null} /> : mode === "signup" ? (
    <TemplateEditorProvider category="signup-forms" templateId="editorial--school-days"><SignupTemplatesPage /></TemplateEditorProvider>
  ) : <EventUrlDialog eventId={id} />}</UnsavedProgressProvider>;
}
createRoot(document.getElementById("root")!).render(<AppRouterContext.Provider value={router}><App /></AppRouterContext.Provider>);
