import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import styles from "@/components/navigation/navigation-appearance.module.css";
import {
  SidebarCategoryFavorites,
  SidebarCategoryShortcut,
} from "@/components/navigation/SidebarCategoryFavorites";
import { Sidebar } from "@/components/ui/sidebar";
import { useCategoryFavorites } from "@/hooks/useCategoryFavorites";
import { useFeatureVisibility } from "@/hooks/useFeatureVisibility";
import { isCategoryFavoriteActive } from "@/lib/category-favorites";
import { type CreationAccess, resolveCreationAccess } from "@/lib/creation-access";

type Status = "authenticated" | "unauthenticated" | "loading";
type Configuration = {
  account?: string;
  signupSource?: string;
  access?: CreationAccess;
  dark?: boolean;
};
const configuration: Configuration = (window as any).categoryFavoritesConfiguration || {};
let state = {
  account: configuration.account || "first-host",
  signupSource: configuration.signupSource,
  access: configuration.access || resolveCreationAccess(),
  session: {
    data: { user: { email: `${configuration.account || "first-host"}@test.com` } },
    status: "authenticated" as Status,
  },
  route: `${location.pathname}${location.search}`,
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
  flushSync(() => {
    for (const listener of listeners) listener();
  });
};
export function useSession() {
  return useSyncExternalStore(subscribe, () => state.session);
}
export default function Link({ href, children, onClick, ...props }: any) {
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        history.pushState({}, "", href);
        update({ route: href });
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
const renders: any[] = [];
let result: ReturnType<typeof useCategoryFavorites>;
(window as any).categoryFavoritesFixture = {
  renders,
  setAccount(account: string, status: Status = "authenticated") {
    update({
      account,
      signupSource: undefined,
      session: {
        data:
          status === "authenticated" ? { user: { email: `${account}@test.com` } } : (null as any),
        status,
      },
    });
  },
  setAccess(access: CreationAccess) {
    update({ access });
  },
  toggle(id: string) {
    return result.toggle(id);
  },
};
if (configuration.dark) document.documentElement.classList.add("dark");

function App() {
  const current = useSyncExternalStore(subscribe, () => state);
  const preferences = useFeatureVisibility();
  result = useCategoryFavorites({
    access: current.access,
    preferences,
    signupSource: current.signupSource,
    defaultCreateIntent: preferences.defaultCreateIntent,
  });
  const search = new URL(current.route, location.origin);
  const activeId =
    result.favorites.find((favorite) =>
      isCategoryFavoriteActive(favorite, search.pathname, search.searchParams),
    )?.id || null;
  const snapshot = {
    account: current.account,
    favorites: result.favorites.map((favorite) => favorite.id),
    options: result.options.map((favorite) => favorite.id),
    defaultCategory: result.defaultCategory?.id || null,
    loading: result.loading,
    saving: result.saving,
    error: result.error,
  };
  renders.push(snapshot);
  (window as any).categoryFavoritesFixture.current = snapshot;
  return (
    <Sidebar open animate={false}>
      <nav
        className={`${styles.chrome} nav-chrome-sidebar-surface`}
        aria-label="Main navigation"
        style={{ width: "min(100%, 320px)", padding: 12 }}
      >
        <a className="fixture-create" href="/create">
          Create event
        </a>
        {result.defaultCategory && (
          <div data-fixture-default-category>
            <SidebarCategoryShortcut
              favorite={result.defaultCategory}
              active={isCategoryFavoriteActive(
                result.defaultCategory,
                search.pathname,
                search.searchParams,
              )}
              onNavigate={() => {
                if (!result.defaultCategory) return;
                history.pushState({}, "", result.defaultCategory.href);
                update({ route: result.defaultCategory.href });
              }}
            />
          </div>
        )}
        <SidebarCategoryFavorites
          {...result}
          activeId={activeId}
          onNavigate={(id) => {
            const favorite = result.favorites.find((candidate) => candidate.id === id);
            if (!favorite) return;
            history.pushState({}, "", favorite.href);
            update({ route: favorite.href });
          }}
          onToggle={result.toggle}
          onRetry={result.retry}
        />
      </nav>
      <main tabIndex={-1}>Fixture content</main>
    </Sidebar>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
