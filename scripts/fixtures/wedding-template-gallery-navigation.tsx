import { forwardRef, type AnchorHTMLAttributes } from "react";

export const useMenuOptional = () => null;
export const usePathname = () => location.pathname;
export const useSearchParams = () => new URLSearchParams(location.search);
export const useRouter = () => ({
  push(href: string) {
    location.assign(href);
  },
});
export const useSession = () => ({
  status: new URLSearchParams(location.search).has("authenticated")
    ? "authenticated"
    : "unauthenticated",
  data: null,
  update: async () => {},
});

const Link = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean; scroll?: boolean }
>(({ prefetch, scroll, ...props }, ref) => <a {...props} ref={ref} />);
Link.displayName = "WeddingGalleryFixtureLink";
export default Link;
