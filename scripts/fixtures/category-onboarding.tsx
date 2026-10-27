import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import CategoryFavoritesSettings from "@/components/account/CategoryFavoritesSettings";
import CategoryInterestOnboarding from "@/components/account/CategoryInterestOnboarding";
import navigationStyles from "@/components/navigation/navigation-appearance.module.css";
import { SidebarCategoryFavorites } from "@/components/navigation/SidebarCategoryFavorites";
import { Sidebar } from "@/components/ui/sidebar";
import { useCategoryFavorites } from "@/hooks/useCategoryFavorites";
import { useCreationAccess } from "@/hooks/useCreationAccess";
import { useFeatureVisibility } from "@/hooks/useFeatureVisibility";
import { applyAppearance } from "@/lib/appearance";
import { isCategoryFavoriteActive } from "@/lib/category-favorites";

type Status = "authenticated" | "unauthenticated" | "loading";
type Configuration = { account?: string; status?: Status; dark?: boolean };
const configuration: Configuration = (window as any).categoryOnboardingConfiguration || {};
let state = {
  account: configuration.account || "first-host",
  status: configuration.status || ("authenticated" as Status),
  route: `${location.pathname}${location.search}`,
};
let session = {
  data: state.status === "authenticated" ? { user: { email: `${state.account}@test.com` } } : null,
  status: state.status,
};
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const update = (next: Partial<typeof state>) => {
  state = { ...state, ...next };
  session = {
    data:
      state.status === "authenticated" ? { user: { email: `${state.account}@test.com` } } : null,
    status: state.status,
  };
  flushSync(() => {
    for (const listener of listeners) listener();
  });
};
export function useSession() {
  return useSyncExternalStore(subscribe, () => session);
}
export function usePathname() {
  return new URL(
    useSyncExternalStore(subscribe, () => state.route),
    location.origin,
  ).pathname;
}
export function useSearchParams() {
  return new URLSearchParams(
    new URL(
      useSyncExternalStore(subscribe, () => state.route),
      location.origin,
    ).search,
  );
}
const navigate = (href: string) => {
  history.pushState({}, "", href);
  update({ route: href });
};
export function useRouter() {
  return { push: navigate, replace: navigate, refresh() {} };
}
export default function Link({ href, onClick, children, ...props }: any) {
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set("x-fixture-account", state.account);
  return nativeFetch(input, { ...init, headers });
};
applyAppearance(configuration.dark ? "dark" : "light", false);
const renders: any[] = [];
(window as any).categoryOnboardingFixture = {
  renders,
  navigate,
  setAccount(account: string, status: Status = "authenticated") {
    update({ account, status });
  },
};

function App() {
  const current = useSyncExternalStore(subscribe, () => state);
  const preferences = useFeatureVisibility();
  const { access, loading: accessLoading } = useCreationAccess();
  const favorites = useCategoryFavorites({ access, preferences });
  const url = new URL(current.route, location.origin);
  const snapshot = {
    account: current.account,
    status: current.status,
    route: current.route,
    loading: preferences.loading || accessLoading,
    hasLoadedPreferences: preferences.hasLoadedPreferences,
    categoryOnboarding: (preferences as any).categoryOnboarding,
    pinnedCategoryIds: preferences.pinnedCategoryIds,
    sportPreferences: preferences.sportPreferences,
    favorites: favorites.favorites.map((favorite) => favorite.id),
  };
  renders.push(snapshot);
  (window as any).categoryOnboardingFixture.current = snapshot;
  return (
    <Sidebar open animate={false}>
      <nav
        aria-label="Main navigation"
        className={`${navigationStyles.chrome} nav-chrome-sidebar-surface fixture-navigation`}
      >
        <Link href="/create">Create event</Link>
        <Link href="/settings#favorites">Settings</Link>
        <SidebarCategoryFavorites
          {...favorites}
          activeId={
            favorites.favorites.find((favorite) =>
              isCategoryFavoriteActive(favorite, url.pathname, url.searchParams),
            )?.id || null
          }
          onNavigate={(id) => {
            const favorite = favorites.favorites.find((value) => value.id === id);
            if (favorite) navigate(favorite.href);
          }}
          onToggle={favorites.toggle}
          onRetry={favorites.retry}
        />
      </nav>
      <main className="fixture-main" tabIndex={-1}>
        {url.pathname === "/settings" ? (
          <section id="favorites">
            <h1>Favorites</h1>
            <CategoryFavoritesSettings />
          </section>
        ) : (
          <h1>Create an event</h1>
        )}
      </main>
      <CategoryInterestOnboarding />
    </Sidebar>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
