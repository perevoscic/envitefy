import { useContext, useSyncExternalStore } from "react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
};
export function useSearchParams() {
  const query = useSyncExternalStore(subscribe, () => window.location.search);
  return new URLSearchParams(query);
}
export function useRouter() { return useContext(AppRouterContext)!; }
export function usePathname() { return useSyncExternalStore(subscribe, () => window.location.pathname); }
