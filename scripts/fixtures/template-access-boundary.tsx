import { useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import CreationAccessBoundary from "@/components/event-create/CreationAccessBoundary";
import type { CreationAccess } from "@/lib/creation-access";

type Status = "unauthenticated" | "loading" | "authenticated";
type State = { status: Status; identity: string; access: CreationAccess | null; loading: boolean; error: string; eventId?: string };
let state: State = { status: "unauthenticated", identity: "", access: null, loading: false, error: "" };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
const useStateSnapshot = () => useSyncExternalStore(subscribe, () => state);
export function useSession() {
  const current = useStateSnapshot();
  return { status: current.status, data: current.identity ? { user: { id: current.identity, email: current.identity } } : null };
}
export function useCreationAccess() {
  const current = useStateSnapshot();
  return { access: current.access, loading: current.loading, error: current.error, reload: async () => {} };
}
let mounts = 0;
function Editor() {
  const [mount] = useState(() => ++mounts);
  const [title, setTitle] = useState("");
  return <label>Event title<input value={title} onChange={event => setTitle(event.target.value)} data-mount={mount} /></label>;
}
function App() {
  const current = useStateSnapshot();
  return <CreationAccessBoundary product="event_page" category="weddings" eventId={current.eventId}><Editor /></CreationAccessBoundary>;
}
declare global {
  interface Window {
    templateAccessFixture: { set: (next: Partial<State>) => void };
  }
}
window.templateAccessFixture = {
  set(next) { flushSync(() => { state = { ...state, ...next }; listeners.forEach(listener => listener()); }); },
};
createRoot(document.getElementById("root")!).render(<App />);
