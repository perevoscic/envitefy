import { useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  notifyFeatureVisibilityChanged,
  useFeatureVisibility,
} from "@/hooks/useFeatureVisibility";

let account = "first-host";
let session = { user: { id: account, email: `${account}@test.com` } };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// This file also supplies the fixture's next-auth/react webpack alias.
export function useSession() {
  const data = useSyncExternalStore(subscribe, () => session);
  return { data, status: "authenticated" };
}

type Snapshot = {
  consumer: string;
  account: string;
  loading: boolean;
  hasLoadedPreferences: boolean;
  error: string;
  visibleTemplateKeys: string[];
};
const current: Record<string, Snapshot> = {};
const renders: Snapshot[] = [];

const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set("x-fixture-account", account);
  return nativeFetch(input, { ...init, headers });
};

window.featureVisibilityFixture = {
  current,
  renders,
  setAccount(nextAccount: string) {
    account = nextAccount;
    session = { user: { id: account, email: `${account}@test.com` } };
    flushSync(() => listeners.forEach((listener) => { listener(); }));
  },
};

declare global {
  interface Window {
    featureVisibilityFixture: {
      current: Record<string, Snapshot>;
      renders: Snapshot[];
      setAccount: (account: string) => void;
    };
  }
}

function Consumer({ name }: { name: string }) {
  const result = useFeatureVisibility();
  const snapshot = {
    consumer: name,
    account,
    loading: result.loading,
    hasLoadedPreferences: result.hasLoadedPreferences,
    error: result.error,
    visibleTemplateKeys: result.visibleTemplateKeys,
  };
  current[name] = snapshot;
  renders.push(snapshot);
  return <section aria-label={`Consumer ${name}`}>
    <pre>{JSON.stringify(snapshot)}</pre>
    <button onClick={() => void result.refresh()}>Refresh {name}</button>
  </section>;
}

createRoot(document.getElementById("root")!).render(<>
  <button onClick={notifyFeatureVisibilityChanged}>Preferences changed</button>
  <Consumer name="A" />
  <Consumer name="B" />
</>);
