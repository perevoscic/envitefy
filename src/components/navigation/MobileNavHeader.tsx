"use client";

import { Pencil } from "lucide-react";
import EnvitefyRouteBrand from "@/components/branding/EnvitefyRouteBrand";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, type ReactNode, type RefObject, useEffect, useRef, useState } from "react";
import { useSidebar } from "@/app/sidebar-context";
import { EVENT_NAVIGATION_SCROLL_EVENT } from "@/lib/event-navigation-scroll";
import appearanceStyles from "./navigation-appearance.module.css";

export default function MobileNavHeader({ visible, onOpenNavigation, onHome, openButtonRef, menuIcon }: {
  visible: boolean;
  onOpenNavigation: () => void;
  onHome: (event: MouseEvent<HTMLAnchorElement>) => void;
  openButtonRef?: RefObject<HTMLButtonElement | null>;
  menuIcon: ReactNode;
}) {
  const { eventEditAction } = useSidebar();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [scrollHidden, setScrollHidden] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const mobile = window.matchMedia("(max-width: 1023px)");
    let lastY = window.scrollY;
    let travel = 0;
    let frame = 0;
    const reset = () => {
      lastY = window.scrollY;
      travel = 0;
      setScrollHidden(false);
    };
    const updatePosition = (y: number, delta: number) => {
      if (!visible || !mobile.matches || !root.hasAttribute("data-event-page-color") ||
        headerRef.current?.contains(document.activeElement) || y <= 8) {
        travel = 0;
        setScrollHidden(false);
        return;
      }
      if (!delta) return;
      travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
      if (travel <= -12) {
        setScrollHidden(false);
        travel = 0;
      } else if (y > 80 && travel >= 12) {
        setScrollHidden(true);
        travel = 0;
      }
    };
    const update = () => {
      frame = 0;
      // Clamp elastic overscroll so bouncing at either edge cannot reverse the header.
      const maxY = Math.max(0, root.scrollHeight - window.innerHeight);
      const y = Math.max(0, Math.min(window.scrollY, maxY));
      const delta = y - lastY;
      lastY = y;
      updatePosition(y, delta);
    };
    const onPreviewScroll = (event: Event) => {
      const detail = (event as CustomEvent<{ y: number; delta: number }>).detail;
      if (detail && Number.isFinite(detail.y) && Number.isFinite(detail.delta)) {
        updatePosition(detail.y, detail.delta);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new MutationObserver(reset);
    observer.observe(root, { attributes: true, attributeFilter: ["data-event-page-color"] });
    reset();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(EVENT_NAVIGATION_SCROLL_EVENT, onPreviewScroll);
    mobile.addEventListener("change", reset);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(EVENT_NAVIGATION_SCROLL_EVENT, onPreviewScroll);
      mobile.removeEventListener("change", reset);
      cancelAnimationFrame(frame);
    };
  }, [pathname, visible]);

  const buttonClass = "nav-chrome-pill-secondary nav-chrome-motion inline-flex h-10 w-10 min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full";
  return (
    <header ref={headerRef} data-app-mobile-topbar="app" data-app-navigation="topbar"
      data-scroll-hidden={scrollHidden ? "true" : "false"}
      onFocusCapture={() => setScrollHidden(false)}
      className={`${appearanceStyles.chrome} fixed inset-x-0 top-0 z-[6500] px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] transition-all duration-300 ease-in-out lg:hidden ${visible ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-full opacity-0 pointer-events-none"}`}>
      <div className="nav-chrome-glass-header nav-chrome-motion flex items-center justify-between gap-3 rounded-[1.65rem] px-3 py-2.5">
        <button ref={openButtonRef} type="button" className={buttonClass}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); onOpenNavigation(); }} aria-label="Open navigation">
          {menuIcon}
        </button>
        <div className="ml-auto flex min-w-0 max-w-full items-center gap-2">
          {eventEditAction ? "href" in eventEditAction ? (
            <Link href={eventEditAction.href} aria-label="Edit event" title="Edit event" className={buttonClass}><Pencil size={18} aria-hidden="true" /></Link>
          ) : (
            <button type="button" onClick={eventEditAction.onClick} aria-label="Edit event" title="Edit event" className={buttonClass}><Pencil size={18} aria-hidden="true" /></button>
          ) : null}
          <Link href="/" onClick={onHome} className="flex h-11 min-w-0 items-center justify-end" aria-label="Envitefy home">
            <EnvitefyRouteBrand raster className="h-auto w-[150px] max-w-full object-contain" priority />
          </Link>
        </div>
      </div>
    </header>
  );
}
