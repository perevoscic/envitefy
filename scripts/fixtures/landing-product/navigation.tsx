import { type AnchorHTMLAttributes, forwardRef } from "react";

declare global {
  interface Window {
    __landingProductNavigation: string[];
    __landingProductAuth: Array<{ mode: string; redirect: string }>;
  }
}

export const usePathname = () => window.location.pathname;
export const useRouter = () => ({
  push(href: string) {
    window.__landingProductNavigation.push(href);
  },
});
export const useSearchParams = () => new URLSearchParams(window.location.search);
export const useSession = () => ({
  status: new URLSearchParams(window.location.search).has("authenticated")
    ? "authenticated"
    : "unauthenticated",
  data: null,
});
const setIsCollapsed = () => {};
export const useSidebar = () => ({ setIsCollapsed });
export const useInstalledAppState = () => ({
  installState: { status: "not_installed", signal: "fixture", meta: null },
  markInstalled() {
    throw new Error("A landing page fixture must not install the app.");
  },
});

const FixtureLink = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean; scroll?: boolean }
>(({ children, prefetch, scroll, ...props }, ref) => (
  <a ref={ref} {...props}>
    {children}
  </a>
));
FixtureLink.displayName = "FixtureLink";
export default FixtureLink;
