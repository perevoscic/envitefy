import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import UnsavedProgressProvider, { useEventProgress } from "../../../src/components/UnsavedProgressProvider";

const fixture = window as typeof window & {
  __progressFixture: { saves: number; discards: number; mode: "save" | "failure" | "account" };
};
fixture.__progressFixture = { saves: 0, discards: 0, mode: "save" };

function Editor() {
  const [title, setTitle] = useState("");
  const [account, setAccount] = useState(false);
  const [completeAccount, setCompleteAccount] = useState<(() => void) | null>(null);
  useEventProgress({
    snapshot: { title },
    save: async () => {
      fixture.__progressFixture.saves++;
      if (fixture.__progressFixture.mode === "failure") throw new Error("Fixture save failed");
      if (fixture.__progressFixture.mode === "account") {
        const beforeLeaving = new Promise<void>((resolve) => {
          setCompleteAccount(() => () => { setAccount(false); resolve(); });
        });
        setAccount(true);
        return { beforeLeaving };
      }
    },
    discard: () => { fixture.__progressFixture.discards++; },
  });
  return <>
    <label>Event title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <a href="/destination">Leave editor</a>
    {account && <div role="dialog" aria-label="Account save">
      <button type="button" onClick={() => completeAccount?.()}>Complete account save</button>
    </div>}
  </>;
}

function App() {
  const [editing, setEditing] = useState(false);
  const [destination, setDestination] = useState(false);
  const navigate = (href: string) => { history.pushState(null, "", href); setDestination(true); };
  const router = {
    push: navigate, replace: navigate, back: () => history.back(), forward: () => history.forward(),
    refresh() {}, prefetch: async () => {},
  };
  return <AppRouterContext.Provider value={router}>
    <UnsavedProgressProvider>
      {destination ? <p>Destination reached</p> : editing ? <Editor /> :
        <button type="button" onClick={() => setEditing(true)}>Start editing</button>}
    </UnsavedProgressProvider>
  </AppRouterContext.Provider>;
}

createRoot(document.getElementById("root")!).render(<App />);
