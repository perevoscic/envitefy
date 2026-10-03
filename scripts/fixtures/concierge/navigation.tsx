import type { AnchorHTMLAttributes } from "react";
export const usePathname = () => window.location.pathname;
export default function FixtureLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />;
}
