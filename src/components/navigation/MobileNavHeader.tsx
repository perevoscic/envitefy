"use client";

import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { MouseEvent, ReactNode, RefObject } from "react";
import { useSidebar } from "@/app/sidebar-context";
import wordmark from "../../../public/brand/envitefy-wordmark.png";

export default function MobileNavHeader({ visible, onOpenNavigation, onHome, openButtonRef, menuIcon }: {
  visible: boolean;
  onOpenNavigation: () => void;
  onHome: (event: MouseEvent<HTMLAnchorElement>) => void;
  openButtonRef?: RefObject<HTMLButtonElement | null>;
  menuIcon: ReactNode;
}) {
  const { eventEditAction } = useSidebar();
  const buttonClass = "nav-chrome-pill-secondary nav-chrome-motion inline-flex h-10 w-10 min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full";
  return (
    <header data-app-mobile-topbar="app" data-app-navigation="topbar"
      className={`fixed inset-x-0 top-0 z-[6500] px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] transition-all duration-300 ease-in-out lg:hidden ${visible ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-full opacity-0 pointer-events-none"}`}>
      <div className="nav-chrome-glass-header nav-chrome-motion flex items-center justify-between gap-3 rounded-[1.65rem] px-3 py-2.5">
        <button ref={openButtonRef} type="button" className={buttonClass}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); onOpenNavigation(); }} aria-label="Open navigation">
          {menuIcon}
        </button>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {eventEditAction ? "href" in eventEditAction ? (
            <Link href={eventEditAction.href} aria-label="Edit event" title="Edit event" className={buttonClass}><Pencil size={18} aria-hidden="true" /></Link>
          ) : (
            <button type="button" onClick={eventEditAction.onClick} aria-label="Edit event" title="Edit event" className={buttonClass}><Pencil size={18} aria-hidden="true" /></button>
          ) : null}
          <Link href="/" onClick={onHome} className="flex h-11 shrink-0 items-center justify-end" aria-label="Envitefy home">
            <Image src={wordmark} alt="" className="h-auto w-[150px] object-contain" priority />
          </Link>
        </div>
      </div>
    </header>
  );
}
