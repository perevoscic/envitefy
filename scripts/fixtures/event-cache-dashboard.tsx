import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useSession } from "next-auth/react";
import { SidebarProvider } from "@/app/sidebar-context";
import { EventCacheProvider, useEventCache } from "@/app/event-cache-context";
import Dashboard from "@/components/Dashboard";

function CacheProbe() {
  const cache = useEventCache();
  const { data: session } = useSession();
  useEffect(() => {
    const fixtureWindow = window as any;
    fixtureWindow.__cacheSnapshots ||= [];
    const snapshots = fixtureWindow.__cacheSnapshots;
    snapshots.push({
      identity: session?.user?.email,
      dashboard: cache.dashboardData,
      history: cache.historySidebarItems,
    });
  });
  return <>
    <output id="cache-state">{JSON.stringify({
      identity: session?.user?.email,
      ready: cache.isIdentityReady,
      hydrated: cache.isHydrated,
      history: cache.historySidebarItems,
      historyLoading: cache.historyLoading,
      dashboard: cache.dashboardData,
      dashboardLoading: cache.dashboardLoading,
      error: cache.dashboardError,
    })}</output>
    <button onClick={() => void cache.refreshAll({ includeDashboard: true })}>Refresh all</button>
    <button onClick={() => cache.removeUnavailableEvent("deleted-event")}>Remove event</button>
    <button onClick={() => window.dispatchEvent(new CustomEvent("history:created", {
      detail: { id: "new-save", title: "New save", deferRefresh: true },
    }))}>Save event</button>
  </>;
}

createRoot(document.getElementById("root")!).render(
  <SidebarProvider><EventCacheProvider><CacheProbe /><Dashboard /></EventCacheProvider></SidebarProvider>,
);
