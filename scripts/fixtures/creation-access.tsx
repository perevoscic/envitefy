import { useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { CREATION_ACCESS_UPDATED_EVENT, useCreationAccess } from "@/hooks/useCreationAccess";
import type { CreationAccess } from "@/lib/creation-access";
import type { InitialCreationAccess } from "@/lib/create/creation-access-client";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";
type Session = { user: { id: string; email: string } } | null;
type Configuration = {
  account?: string;
  status?: SessionStatus;
  initialCreationAccess?: InitialCreationAccess;
};
const configuration = window.creationAccessConfiguration || {};
let account = configuration.account || "first-host";
let sessionState: { data: Session; status: SessionStatus } = {
  data: configuration.status === "loading" || configuration.status === "unauthenticated"
    ? null : { user: { id: account, email: `${account}@test.com` } },
  status: configuration.status || "authenticated",
};
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// This file also supplies the fixture's next-auth/react webpack alias.
export function useSession() {
  return useSyncExternalStore(subscribe, () => sessionState);
}

type Snapshot = {
  consumer: string;
  account: string;
  status: SessionStatus;
  loading: boolean;
  access: CreationAccess | null;
  error: string;
};
const current: Record<string, Snapshot> = {};
const renders: Snapshot[] = [];
const requests: { account: string; time: number }[] = [];
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set("x-fixture-account", account);
  requests.push({ account, time: Date.now() });
  return nativeFetch(input, { ...init, headers });
};

window.creationAccessFixture = {
  current,
  renders,
  requests,
  setSession(nextAccount: string, status: SessionStatus = "authenticated") {
    account = nextAccount;
    sessionState = {
      data: status === "authenticated" ? { user: { id: account, email: `${account}@test.com` } } : null,
      status,
    };
    flushSync(() => listeners.forEach(listener => { listener(); }));
  },
};

declare global {
  interface Window {
    creationAccessConfiguration?: Configuration;
    creationAccessFixture: {
      current: Record<string, Snapshot>;
      renders: Snapshot[];
      requests: { account: string; time: number }[];
      setSession: (account: string, status?: SessionStatus) => void;
    };
  }
}

function Consumer({ name }: { name: string }) {
  const result = useCreationAccess(configuration.initialCreationAccess);
  const snapshot = {
    consumer: name,
    account,
    status: sessionState.status,
    loading: result.loading,
    access: result.access,
    error: result.error,
  };
  current[name] = snapshot;
  renders.push(snapshot);
  return <section aria-label={`Consumer ${name}`}>
    <pre>{JSON.stringify(snapshot)}</pre>
    <button onClick={() => void result.reload()}>Refresh {name}</button>
  </section>;
}

createRoot(document.getElementById("root")!).render(<>
  <button onClick={() => window.dispatchEvent(new Event(CREATION_ACCESS_UPDATED_EVENT))}>Access changed</button>
  <Consumer name="A" />
  <Consumer name="B" />
</>);
