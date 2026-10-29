import { useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import SettingsPage from "../../src/app/settings/page";
import AppearanceProvider from "../../src/components/AppearanceProvider";
import { SidebarProvider } from "../../src/app/sidebar-context";
import { MainContentWrapper } from "../../src/components/MainContentWrapper";

let session = {
  data: { user: { email: "host@settings.test", name: "Test Host", image: null } },
  status: "authenticated",
  update: async () => ({}),
};
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useSession() {
  return useSyncExternalStore(
    subscribe,
    () => session,
    () => session,
  );
}

declare global {
  interface Window {
    settingsWorkspaceFixture: { setAccount(email: string, name: string): void };
  }
}
window.settingsWorkspaceFixture = {
  setAccount(email, name) {
    session = { ...session, data: { user: { email, name, image: null } } };
    listeners.forEach((listener) => {
      listener();
    });
  },
};

createRoot(document.getElementById("root")!).render(
  <AppearanceProvider>
    <SidebarProvider>
      <MainContentWrapper
        isAuthenticated={window.location.pathname !== "/verify-request"}
        reserveSidebarSpace={false}
      >
        <SettingsPage />
      </MainContentWrapper>
    </SidebarProvider>
  </AppearanceProvider>,
);
